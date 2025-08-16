import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from './health-check-service';
import { logger } from './production-logger';
import { ApiResponseBuilder } from './api-response';

/**
 * Graceful degradation middleware and utilities
 * Provides fallback mechanisms when services are unavailable
 */

export interface DegradationOptions {
  requireDatabase?: boolean;
  requireRedis?: boolean;
  requireStripe?: boolean;
  requireExternalAPIs?: boolean;
  fallbackResponse?: any;
  gracefulFallback?: boolean;
}

/**
 * Middleware to handle graceful degradation for API routes
 */
export function withGracefulDegradation(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: DegradationOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check service availability
      const serviceChecks = await Promise.all([
        options.requireDatabase ? healthCheckService.isServiceAvailable('database') : Promise.resolve(true),
        options.requireRedis ? healthCheckService.isServiceAvailable('redis') : Promise.resolve(true),
        options.requireStripe ? healthCheckService.isServiceAvailable('stripe') : Promise.resolve(true),
        options.requireExternalAPIs ? healthCheckService.isServiceAvailable('external_apis') : Promise.resolve(true),
      ]);

      const [dbAvailable, redisAvailable, stripeAvailable, externalAvailable] = serviceChecks;

      // If critical services are down and no graceful fallback is enabled
      if (!options.gracefulFallback) {
        if (options.requireDatabase && !dbAvailable) {
          return createServiceUnavailableResponse('Database service is currently unavailable');
        }
        if (options.requireStripe && !stripeAvailable) {
          return createServiceUnavailableResponse('Payment service is currently unavailable');
        }
      }

      // Add service availability to request headers for handler to use
      const enhancedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-service-database': dbAvailable.toString(),
          'x-service-redis': redisAvailable.toString(),
          'x-service-stripe': stripeAvailable.toString(),
          'x-service-external': externalAvailable.toString(),
        },
        body: request.body,
      });

      // Call the original handler
      const response = await handler(enhancedRequest);

      // Add degradation headers to response
      response.headers.set('x-system-status', await getSystemStatusHeader());
      if (!redisAvailable) {
        response.headers.set('x-cache-status', 'disabled');
      }
      if (!stripeAvailable) {
        response.headers.set('x-payment-status', 'degraded');
      }

      return response;
    } catch (error) {
      logger.error('Graceful degradation middleware error:', error);
      
      if (options.fallbackResponse) {
        return NextResponse.json(options.fallbackResponse, { status: 200 });
      }
      
      return createServiceUnavailableResponse('Service temporarily unavailable');
    }
  };
}

/**
 * Check if a feature should be available based on service dependencies
 */
export async function isFeatureAvailable(feature: string): Promise<boolean> {
  const degradationStatus = await healthCheckService.getDegradationStatus();
  
  switch (feature) {
    case 'booking':
      return degradationStatus.canAcceptNewBookings;
    case 'payment':
      return degradationStatus.canProcessPayments;
    case 'notifications':
      return degradationStatus.canSendNotifications;
    case 'cache':
      return degradationStatus.canUseCache;
    default:
      return true;
  }
}

/**
 * Get fallback data when primary service is unavailable
 */
export async function getFallbackData<T>(
  primaryDataFetcher: () => Promise<T>,
  fallbackData: T,
  serviceName?: string
): Promise<T> {
  try {
    return await primaryDataFetcher();
  } catch (error) {
    logger.warn(`Primary data fetch failed, using fallback${serviceName ? ` for ${serviceName}` : ''}:`, error);
    return fallbackData;
  }
}

/**
 * Execute with fallback when service is unavailable
 */
export async function executeWithFallback<T>(
  primaryAction: () => Promise<T>,
  fallbackAction: () => Promise<T>,
  serviceName?: string
): Promise<T> {
  try {
    return await primaryAction();
  } catch (error) {
    logger.warn(`Primary action failed, executing fallback${serviceName ? ` for ${serviceName}` : ''}:`, error);
    return await fallbackAction();
  }
}

/**
 * Cache-aware data fetcher with fallback
 */
export async function fetchWithCacheFallback<T>(
  cacheKey: string,
  dataFetcher: () => Promise<T>,
  fallbackData?: T,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  const canUseCache = await healthCheckService.isServiceAvailable('redis');
  
  if (canUseCache) {
    try {
      const { Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL!);
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        redis.disconnect();
        return JSON.parse(cached);
      }
      
      // Fetch fresh data
      const data = await dataFetcher();
      
      // Store in cache
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
      redis.disconnect();
      
      return data;
    } catch (error) {
      logger.warn('Cache operation failed, fetching without cache:', error);
    }
  }
  
  // Fallback to direct data fetch
  try {
    return await dataFetcher();
  } catch (error) {
    if (fallbackData !== undefined) {
      logger.warn('Data fetch failed, using fallback data:', error);
      return fallbackData;
    }
    throw error;
  }
}

/**
 * Payment processing with graceful degradation
 */
export async function processPaymentWithFallback(
  paymentData: any,
  fallbackHandler?: () => Promise<any>
): Promise<{ success: boolean; data?: any; fallback?: boolean }> {
  const canProcessPayments = await healthCheckService.isServiceAvailable('stripe');
  
  if (!canProcessPayments) {
    if (fallbackHandler) {
      logger.info('Stripe unavailable, using fallback payment handler');
      const result = await fallbackHandler();
      return { success: true, data: result, fallback: true };
    } else {
      logger.warn('Payment processing unavailable and no fallback configured');
      return { success: false };
    }
  }
  
  try {
    // Process payment normally
    // This would contain the actual Stripe payment logic
    return { success: true, data: paymentData };
  } catch (error) {
    logger.error('Payment processing failed:', error);
    
    if (fallbackHandler) {
      const result = await fallbackHandler();
      return { success: true, data: result, fallback: true };
    }
    
    return { success: false };
  }
}

/**
 * Database operation with read-only fallback
 */
export async function executeDbOperationWithFallback<T>(
  writeOperation: () => Promise<T>,
  readOnlyFallback?: () => Promise<T>
): Promise<{ success: boolean; data?: T; readOnly?: boolean }> {
  const dbAvailable = await healthCheckService.isServiceAvailable('database');
  
  if (!dbAvailable) {
    if (readOnlyFallback) {
      logger.info('Database write unavailable, using read-only fallback');
      const result = await readOnlyFallback();
      return { success: true, data: result, readOnly: true };
    } else {
      return { success: false };
    }
  }
  
  try {
    const result = await writeOperation();
    return { success: true, data: result };
  } catch (error) {
    logger.error('Database operation failed:', error);
    
    if (readOnlyFallback) {
      const result = await readOnlyFallback();
      return { success: true, data: result, readOnly: true };
    }
    
    return { success: false };
  }
}

/**
 * Create a service unavailable response
 */
function createServiceUnavailableResponse(message: string): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Service Unavailable',
    message,
    timestamp: new Date().toISOString(),
    retry_after: 60, // Suggest retry after 60 seconds
  }, { 
    status: 503,
    headers: {
      'Retry-After': '60',
      'X-Service-Status': 'degraded',
    }
  });
}

/**
 * Get system status header
 */
async function getSystemStatusHeader(): Promise<string> {
  try {
    const degradationStatus = await healthCheckService.getDegradationStatus();
    
    if (degradationStatus.fallbackModes.length === 0) {
      return 'healthy';
    } else if (degradationStatus.canAcceptNewBookings) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Utility to check service availability in components
 */
export const ServiceAvailability = {
  async database(): Promise<boolean> {
    return await healthCheckService.isServiceAvailable('database');
  },
  
  async redis(): Promise<boolean> {
    return await healthCheckService.isServiceAvailable('redis');
  },
  
  async stripe(): Promise<boolean> {
    return await healthCheckService.isServiceAvailable('stripe');
  },
  
  async externalAPIs(): Promise<boolean> {
    return await healthCheckService.isServiceAvailable('external_apis');
  },
  
  async all(): Promise<Record<string, boolean>> {
    const [database, redis, stripe, external_apis] = await Promise.all([
      this.database(),
      this.redis(),
      this.stripe(),
      this.externalAPIs(),
    ]);
    
    return { database, redis, stripe, external_apis };
  }
};