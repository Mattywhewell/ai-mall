import { RedisStore } from '../rate-limiting/rate-limiter';

interface BruteForceConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
}

export class BruteForceProtection {
  private redis: RedisStore;
  private config: BruteForceConfig;

  constructor(redis: RedisStore, config: Partial<BruteForceConfig> = {}) {
    this.redis = redis;
    this.config = {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      ...config
    };
  }

  async checkBruteForce(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number; blockedUntil?: Date }> {
    const key = `brute_force:${identifier}`;
    const attemptsKey = `${key}:attempts`;
    const blockKey = `${key}:blocked`;

    // Check if currently blocked
    const blockedUntil = await this.redis.get(blockKey);
    if (blockedUntil) {
      const blockTime = new Date(blockedUntil);
      if (blockTime > new Date()) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: blockTime
        };
      } else {
        // Block expired, clean up
        await this.redis.del(blockKey);
      }
    }

    // Get current attempts
    const attempts = parseInt(await this.redis.get(attemptsKey) || '0');

    if (attempts >= this.config.maxAttempts) {
      // Block the identifier
      const blockedUntil = new Date(Date.now() + this.config.blockDurationMs);
      await this.redis.set(blockKey, blockedUntil.toISOString(), this.config.blockDurationMs / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - attempts - 1
    };
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = `brute_force:${identifier}`;
    const attemptsKey = `${key}:attempts`;

    const attempts = parseInt(await this.redis.get(attemptsKey) || '0');
    await this.redis.set(attemptsKey, (attempts + 1).toString(), this.config.windowMs / 1000);
  }

  async resetAttempts(identifier: string): Promise<void> {
    const key = `brute_force:${identifier}`;
    const attemptsKey = `${key}:attempts`;
    const blockKey = `${key}:blocked`;

    await Promise.all([
      this.redis.del(attemptsKey),
      this.redis.del(blockKey)
    ]);
  }
}