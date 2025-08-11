import { NextRequest } from 'next/server';
import Redis from 'ioredis';

// Rate limiter configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest) => void;
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  search: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },
  booking: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10,
    skipSuccessfulRequests: true,
  },
  auth: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true,
  },
  api: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000,
    skipSuccessfulRequests: true,
  },
  upload: {
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
    skipSuccessfulRequests: false,
  },
  admin: {
    windowMs: 60000, // 1 minute
    maxRequests: 200,
    skipSuccessfulRequests: true,
  },
} as const;

class RateLimiter {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
      } catch (error) {
        console.warn('Redis connection failed, falling back to memory store:', error);
      }
    }
  }

  private getDefaultKeyGenerator(req: NextRequest): string {
    // Use IP address and user agent for anonymous users
    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // If user is authenticated, use user ID
    const userId = req.headers.get('x-user-id');
    if (userId) {
      return `user:${userId}`;
    }
    
    // Create a hash of IP + User Agent for anonymous users
    return `anon:${Buffer.from(ip + userAgent).toString('base64').slice(0, 16)}`;
  }

  async checkRateLimit(
    req: NextRequest,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const keyGenerator = config.keyGenerator || this.getDefaultKeyGenerator.bind(this);
    const key = `rate_limit:${keyGenerator(req)}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.redis) {
      return this.checkRateLimitRedis(key, config, now, windowStart);
    } else {
      return this.checkRateLimitMemory(key, config, now, windowStart);
    }
  }

  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    if (!this.redis) {
      throw new Error('Redis not available');
    }

    // Use Redis sorted set to track requests in time window
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const totalHits = (results[1][1] as number) + 1;
    const allowed = totalHits <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - totalHits);
    const resetTime = now + config.windowMs;

    if (!allowed && config.onLimitReached) {
      config.onLimitReached(req as NextRequest);
    }

    return {
      allowed,
      remaining,
      resetTime,
      totalHits,
    };
  }

  private checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  } {
    // Clean up expired entries
    for (const [k, v] of this.memoryStore.entries()) {
      if (v.resetTime < now) {
        this.memoryStore.delete(k);
      }
    }

    const current = this.memoryStore.get(key);
    let totalHits = 1;
    let resetTime = now + config.windowMs;

    if (current && current.resetTime > now) {
      totalHits = current.count + 1;
      resetTime = current.resetTime;
    }

    this.memoryStore.set(key, { count: totalHits, resetTime });

    const allowed = totalHits <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - totalHits);

    if (!allowed && config.onLimitReached) {
      config.onLimitReached(req as NextRequest);
    }

    return {
      allowed,
      remaining,
      resetTime,
      totalHits,
    };
  }

  // Helper method to create rate limit middleware
  createMiddleware(configName: keyof typeof rateLimitConfigs) {
    const config = rateLimitConfigs[configName];
    
    return async (req: NextRequest) => {
      const result = await this.checkRateLimit(req, config);
      
      return {
        ...result,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'X-RateLimit-Window': config.windowMs.toString(),
        },
      };
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Helper function to apply rate limiting to API routes
export async function withRateLimit<T>(
  req: NextRequest,
  configName: keyof typeof rateLimitConfigs,
  handler: () => Promise<T>
): Promise<T> {
  const middleware = rateLimiter.createMiddleware(configName);
  const result = await middleware(req);

  if (!result.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`);
  }

  return handler();
}

// Rate limit error class
export class RateLimitError extends Error {
  constructor(
    message: string,
    public remaining: number,
    public resetTime: number,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}