/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
  return async (request: NextRequest) => {
    const identifier = getIdentifier(request);
    const now = Date.now();

    // Get or create rate limit entry
    let limitData = rateLimitStore.get(identifier);

    // Reset if window has passed
    if (!limitData || now > limitData.resetAt) {
      limitData = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(identifier, limitData);
    }

    // Increment count
    limitData.count++;

    // Check if limit exceeded
    if (limitData.count > config.maxRequests) {
      const resetIn = Math.ceil((limitData.resetAt - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitData.resetAt.toString(),
            'Retry-After': resetIn.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const remaining = config.maxRequests - limitData.count;
    const response = NextResponse.next();
    
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', limitData.resetAt.toString());

    return response;
  };
}

function getIdentifier(request: NextRequest): string {
  // Try to get user ID from auth
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// Predefined rate limit configurations
export const rateLimits = {
  // Strict: 10 requests per minute
  strict: { maxRequests: 10, windowMs: 60000 },
  
  // Standard: 100 requests per minute
  standard: { maxRequests: 100, windowMs: 60000 },
  
  // Generous: 1000 requests per minute
  generous: { maxRequests: 1000, windowMs: 60000 },
  
  // AI endpoints: 20 requests per minute (expensive)
  ai: { maxRequests: 20, windowMs: 60000 },
  
  // Auth endpoints: 5 requests per minute
  auth: { maxRequests: 5, windowMs: 60000 },
};
