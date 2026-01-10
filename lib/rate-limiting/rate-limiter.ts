import { Redis } from 'ioredis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  store?: 'memory' | 'redis'; // Storage backend
  redisUrl?: string; // Redis connection URL
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  cleanup?(): Promise<void>;
}

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    } else {
      // Increment existing counter
      entry.count++;
      this.store.set(key, entry);
      return { count: entry.count, resetTime: entry.resetTime };
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

class RedisStore implements RateLimitStore {
  private redis: Redis;
  private prefix = 'ratelimit:';

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      retryDelayOnClusterDown: 100,
    });

    // Handle connection errors gracefully
    this.redis.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
    });
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const prefixedKey = this.prefix + key;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Increment counter and set expiry
      pipeline.incr(prefixedKey);
      pipeline.pexpireat(prefixedKey, resetTime);

      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 1;

      return { count, resetTime };
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fallback to memory store behavior
      return { count: 1, resetTime };
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles cleanup automatically with TTL
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error) {
      console.warn('Redis disconnect error:', error);
    }
  }
}

const memoryStore = new MemoryStore();

// Cleanup expired entries every 5 minutes for memory store
setInterval(() => memoryStore.cleanup(), 5 * 60 * 1000);

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (request: Request) => {
      // Default key generator: IP address + path
      const ip = request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      const url = new URL(request.url);
      return `${ip}:${url.pathname}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    store = process.env.NODE_ENV === 'production' ? 'redis' : 'memory',
    redisUrl,
  } = options;

  // Initialize store based on configuration
  let rateLimitStore: RateLimitStore;
  if (store === 'redis') {
    rateLimitStore = new RedisStore(redisUrl);
  } else {
    rateLimitStore = memoryStore;
  }

  return async function rateLimitMiddleware(request: Request): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
    limit: number;
  }> {
    const key = keyGenerator(request);
    const { count, resetTime } = await rateLimitStore.increment(key, windowMs);

    const allowed = count <= maxRequests;

    return {
      allowed,
      count,
      resetTime,
      limit: maxRequests,
    };
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict rate limiting for auth endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  }),

  // General API rate limiting
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  }),

  // Stricter rate limiting for admin endpoints
  admin: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  }),

  // Rate limiting for file uploads
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  }),

  // Rate limiting for search endpoints
  search: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 searches per minute
  }),
};

// Helper function to apply rate limiting to Next.js API routes
export async function withRateLimit(
  request: Request,
  rateLimiter: ReturnType<typeof createRateLimit>,
  options: {
    onLimitExceeded?: (result: { count: number; resetTime: number; limit: number }) => Response;
  } = {}
) {
  const result = await rateLimiter(request);

  if (!result.allowed) {
    const { onLimitExceeded } = options;
    if (onLimitExceeded) {
      return onLimitExceeded(result);
    }

    // Default response
    const resetInSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        retryAfter: resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': Math.max(0, result.limit - result.count).toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': resetInSeconds.toString(),
        },
      }
    );
  }

  return null; // Continue with the request
}