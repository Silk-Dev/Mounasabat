import { logger } from './production-logger';
import { performHealthCheck, ServiceHealthStatus, HealthCheck } from './monitoring';
import { prisma } from './prisma';

/**
 * Enhanced Health Check Service with graceful degradation
 * Provides detailed system status monitoring and fallback mechanisms
 */
export class HealthCheckService {
  private static instance: HealthCheckService;
  private lastHealthCheck: HealthCheck | null = null;
  private healthCheckCache: Map<string, { data: ServiceHealthStatus; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<HealthCheck> {
    try {
      const healthCheck = await performHealthCheck();
      this.lastHealthCheck = healthCheck;
      
      // Store health check results for monitoring
      await this.storeHealthCheckResult(healthCheck);
      
      return healthCheck;
    } catch (error) {
      logger.error('Failed to perform health check:', error);
      
      // Return cached result if available, otherwise return unhealthy status
      if (this.lastHealthCheck) {
        logger.warn('Returning cached health check result due to error');
        return {
          ...this.lastHealthCheck,
          timestamp: new Date().toISOString(),
          status: 'degraded', // Mark as degraded since we couldn't get fresh data
        };
      }
      
      return this.getEmergencyHealthStatus();
    }
  }

  /**
   * Quick health check for load balancers (lightweight)
   */
  async getQuickHealth(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Quick database ping
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
      };
    } catch (error) {
      logger.error('Quick health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if a specific service is available
   */
  async isServiceAvailable(serviceName: 'database' | 'redis' | 'stripe' | 'external_apis'): Promise<boolean> {
    const cacheKey = `service_${serviceName}`;
    const cached = this.healthCheckCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.status === 'healthy';
    }
    
    try {
      let serviceStatus: ServiceHealthStatus;
      
      switch (serviceName) {
        case 'database':
          serviceStatus = await this.checkDatabaseQuick();
          break;
        case 'redis':
          serviceStatus = await this.checkRedisQuick();
          break;
        case 'stripe':
          serviceStatus = await this.checkStripeQuick();
          break;
        case 'external_apis':
          serviceStatus = await this.checkExternalAPIsQuick();
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }
      
      // Cache the result
      this.healthCheckCache.set(cacheKey, {
        data: serviceStatus,
        timestamp: Date.now(),
      });
      
      return serviceStatus.status === 'healthy';
    } catch (error) {
      logger.error(`Failed to check service ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Get graceful degradation status for the application
   */
  async getDegradationStatus(): Promise<{
    canAcceptNewBookings: boolean;
    canProcessPayments: boolean;
    canSendNotifications: boolean;
    canUseCache: boolean;
    fallbackModes: string[];
  }> {
    const [dbAvailable, redisAvailable, stripeAvailable] = await Promise.all([
      this.isServiceAvailable('database'),
      this.isServiceAvailable('redis'),
      this.isServiceAvailable('stripe'),
    ]);

    const fallbackModes: string[] = [];
    
    if (!redisAvailable) {
      fallbackModes.push('no_caching');
    }
    
    if (!stripeAvailable) {
      fallbackModes.push('payment_degraded');
    }
    
    if (!dbAvailable) {
      fallbackModes.push('read_only_mode');
    }

    return {
      canAcceptNewBookings: dbAvailable && stripeAvailable,
      canProcessPayments: stripeAvailable,
      canSendNotifications: true, // Notifications can work without external dependencies
      canUseCache: redisAvailable,
      fallbackModes,
    };
  }

  /**
   * Store health check results for historical analysis
   */
  private async storeHealthCheckResult(healthCheck: HealthCheck): Promise<void> {
    try {
      // Only store if system is not healthy to avoid too much data
      if (healthCheck.status !== 'healthy') {
        await prisma.systemAlert.create({
          data: {
            type: 'health_check',
            severity: healthCheck.status === 'unhealthy' ? 'ERROR' : 'WARNING',
            message: `System health check: ${healthCheck.status}`,
            metadata: {
              services: healthCheck.services,
              metrics: healthCheck.metrics,
              degradation_info: healthCheck.degradation_info,
            },
            environment: process.env.NODE_ENV || 'development',
            resolved: false,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to store health check result:', error);
    }
  }

  /**
   * Quick database health check
   */
  private async checkDatabaseQuick(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Database error',
      };
    }
  }

  /**
   * Quick Redis health check
   */
  private async checkRedisQuick(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!process.env.REDIS_URL) {
        return {
          status: 'healthy',
          responseTime: 0,
          lastChecked: new Date(),
          details: { note: 'Redis not configured' },
        };
      }
      
      const { Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 2000,
        lazyConnect: true,
      });
      
      await redis.ping();
      redis.disconnect();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Redis error',
      };
    }
  }

  /**
   * Quick Stripe health check
   */
  private async checkStripeQuick(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          status: 'healthy',
          responseTime: 0,
          lastChecked: new Date(),
          details: { note: 'Stripe not configured' },
        };
      }
      
      // Just check if we can reach Stripe API
      const response = await fetch('https://api.stripe.com/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
        signal: AbortSignal.timeout(3000),
      });
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Stripe error',
      };
    }
  }

  /**
   * Quick external APIs health check
   */
  private async checkExternalAPIsQuick(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Simple connectivity test
      const response = await fetch('https://httpstat.us/200', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'degraded', // External APIs being down shouldn't make system unhealthy
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'External API error',
      };
    }
  }

  /**
   * Emergency health status when health check system fails
   */
  private getEmergencyHealthStatus(): HealthCheck {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: {
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Health check system failure',
        },
        redis: {
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Health check system failure',
        },
        stripe: {
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Health check system failure',
        },
        external_apis: {
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          error: 'Health check system failure',
        },
      },
      metrics: {
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage: 0,
        active_connections: 0,
        response_time: 0,
        database_connections: 0,
        error_rate: 0,
      },
    };
  }

  /**
   * Clear health check cache
   */
  clearCache(): void {
    this.healthCheckCache.clear();
    logger.info('Health check cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.healthCheckCache.size,
      keys: Array.from(this.healthCheckCache.keys()),
    };
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();