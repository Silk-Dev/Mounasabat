import * as Sentry from '@sentry/nextjs';
import { logger } from './production-logger';
import { prisma } from './prisma';

// Initialize Sentry for error monitoring
export function initializeMonitoring() {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out sensitive information
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
      ],
    });
  }
}

// Custom metrics tracking
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  timing(metric: string, duration: number): void {
    this.metrics.set(`${metric}_duration`, duration);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Enhanced health check interfaces
export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, any>;
  lastChecked: Date;
  error?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealthStatus;
    redis: ServiceHealthStatus;
    stripe: ServiceHealthStatus;
    external_apis: ServiceHealthStatus;
  };
  metrics: {
    memory_usage: number;
    cpu_usage: number;
    active_connections: number;
    response_time: number;
    database_connections: number;
    error_rate: number;
  };
  degradation_info?: {
    affected_services: string[];
    fallback_status: Record<string, boolean>;
    estimated_recovery?: string;
  };
}

export async function performHealthCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Perform all health checks in parallel with timeouts
    const [dbCheck, redisCheck, stripeCheck, externalApiCheck, systemMetrics] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkStripeHealth(),
      checkExternalAPIsHealth(),
      getSystemMetrics()
    ]);
    
    const database = dbCheck.status === 'fulfilled' ? dbCheck.value : createFailedHealthStatus('Database check failed', dbCheck.reason);
    const redis = redisCheck.status === 'fulfilled' ? redisCheck.value : createFailedHealthStatus('Redis check failed', redisCheck.reason);
    const stripe = stripeCheck.status === 'fulfilled' ? stripeCheck.value : createFailedHealthStatus('Stripe check failed', stripeCheck.reason);
    const external_apis = externalApiCheck.status === 'fulfilled' ? externalApiCheck.value : createFailedHealthStatus('External API check failed', externalApiCheck.reason);
    const metrics = systemMetrics.status === 'fulfilled' ? systemMetrics.value : getDefaultMetrics();
    
    // Determine overall system status
    const services = { database, redis, stripe, external_apis };
    const overallStatus = determineOverallStatus(services);
    
    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services,
      metrics: {
        ...metrics,
        response_time: Date.now() - startTime,
      },
    };
    
    // Add degradation info if system is degraded
    if (overallStatus === 'degraded') {
      healthCheck.degradation_info = getDegradationInfo(services);
    }
    
    // Log health check results for monitoring
    if (overallStatus !== 'healthy') {
      logger.warn('System health check shows issues', {
        status: overallStatus,
        services: Object.entries(services).reduce((acc, [key, service]) => {
          acc[key] = service.status;
          return acc;
        }, {} as Record<string, string>),
      });
    }
    
    return healthCheck;
  } catch (error) {
    logger.error('Health check failed completely:', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: createFailedHealthStatus('Health check system failure'),
        redis: createFailedHealthStatus('Health check system failure'),
        stripe: createFailedHealthStatus('Health check system failure'),
        external_apis: createFailedHealthStatus('Health check system failure'),
      },
      metrics: {
        ...getDefaultMetrics(),
        response_time: Date.now() - startTime,
      },
    };
  }
}

function createFailedHealthStatus(error: string, details?: any): ServiceHealthStatus {
  return {
    status: 'unhealthy',
    responseTime: 0,
    lastChecked: new Date(),
    error,
    details: details ? { error: String(details) } : undefined,
  };
}

function determineOverallStatus(services: Record<string, ServiceHealthStatus>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(s => s.status);
  
  // If database is unhealthy, system is unhealthy
  if (services.database.status === 'unhealthy') {
    return 'unhealthy';
  }
  
  // If any critical service is unhealthy, system is degraded
  if (statuses.includes('unhealthy')) {
    return 'degraded';
  }
  
  // If any service is degraded, system is degraded
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

function getDegradationInfo(services: Record<string, ServiceHealthStatus>) {
  const affectedServices = Object.entries(services)
    .filter(([_, service]) => service.status !== 'healthy')
    .map(([name, _]) => name);
  
  const fallbackStatus: Record<string, boolean> = {
    payment_processing: services.stripe.status === 'healthy',
    caching: services.redis.status === 'healthy',
    external_integrations: services.external_apis.status === 'healthy',
    core_functionality: services.database.status === 'healthy',
  };
  
  return {
    affected_services: affectedServices,
    fallback_status: fallbackStatus,
    estimated_recovery: affectedServices.length > 2 ? '15-30 minutes' : '5-10 minutes',
  };
}

async function checkDatabaseHealth(): Promise<ServiceHealthStatus> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test a simple query to ensure database is responsive
    const userCount = await prisma.user.count();
    
    // Check database connection pool status
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    ` as any[];
    
    const responseTime = Date.now() - startTime;
    
    // Determine status based on response time and connection health
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (responseTime > 5000) {
      status = 'unhealthy';
    } else if (responseTime > 1000) {
      status = 'degraded';
    }
    
    return {
      status,
      responseTime,
      lastChecked: new Date(),
      details: {
        user_count: userCount,
        connections: connectionInfo[0] || {},
        query_performance: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow',
      },
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown database error',
      details: {
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    };
  }
}

async function checkRedisHealth(): Promise<ServiceHealthStatus> {
  const startTime = Date.now();
  
  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'healthy',
        responseTime: 0,
        lastChecked: new Date(),
        details: { note: 'Redis not configured - skipping check' },
      };
    }
    
    const { Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 5000,
      lazyConnect: true,
    });
    
    // Test basic connectivity
    await redis.ping();
    
    // Test read/write operations
    const testKey = `health_check_${Date.now()}`;
    await redis.set(testKey, 'test', 'EX', 10);
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    
    // Get Redis info
    const info = await redis.info('memory');
    const memoryInfo = parseRedisInfo(info);
    
    redis.disconnect();
    
    const responseTime = Date.now() - startTime;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (responseTime > 2000 || testValue !== 'test') {
      status = 'unhealthy';
    } else if (responseTime > 500) {
      status = 'degraded';
    }
    
    return {
      status,
      responseTime,
      lastChecked: new Date(),
      details: {
        memory_usage: memoryInfo.used_memory_human || 'unknown',
        connected_clients: memoryInfo.connected_clients || 'unknown',
        operations_test: testValue === 'test' ? 'passed' : 'failed',
      },
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

async function checkStripeHealth(): Promise<ServiceHealthStatus> {
  const startTime = Date.now();
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'healthy',
        responseTime: 0,
        lastChecked: new Date(),
        details: { note: 'Stripe not configured - skipping check' },
      };
    }
    
    // Test Stripe API connectivity
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}: ${response.statusText}`);
    }
    
    const accountData = await response.json();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (responseTime > 5000) {
      status = 'degraded';
    }
    
    return {
      status,
      responseTime,
      lastChecked: new Date(),
      details: {
        account_id: accountData.id,
        charges_enabled: accountData.charges_enabled,
        payouts_enabled: accountData.payouts_enabled,
        country: accountData.country,
      },
    };
  } catch (error) {
    logger.error('Stripe health check failed:', error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown Stripe error',
    };
  }
}

async function checkExternalAPIsHealth(): Promise<ServiceHealthStatus> {
  const startTime = Date.now();
  const results: Record<string, boolean> = {};
  
  try {
    // Check multiple external services in parallel
    const checks = await Promise.allSettled([
      // Add other external API checks here as needed
      checkGenericHealthEndpoint('https://httpstat.us/200', 'httpstat'),
    ]);
    
    checks.forEach((result, index) => {
      const serviceName = ['httpstat'][index];
      results[serviceName] = result.status === 'fulfilled' && result.value;
    });
    
    const responseTime = Date.now() - startTime;
    const successfulChecks = Object.values(results).filter(Boolean).length;
    const totalChecks = Object.keys(results).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (successfulChecks === 0) {
      status = 'unhealthy';
    } else if (successfulChecks < totalChecks) {
      status = 'degraded';
    }
    
    return {
      status,
      responseTime,
      lastChecked: new Date(),
      details: {
        services_checked: totalChecks,
        services_healthy: successfulChecks,
        individual_results: results,
      },
    };
  } catch (error) {
    logger.error('External APIs health check failed:', error);
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown external API error',
    };
  }
}

async function checkGenericHealthEndpoint(url: string, serviceName: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    logger.warn(`External service ${serviceName} health check failed:`, error);
    return false;
  }
}

function parseRedisInfo(info: string): Record<string, string> {
  const lines = info.split('\r\n');
  const result: Record<string, string> = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      result[key] = value;
    }
  }
  
  return result;
}

async function getSystemMetrics() {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get database connection count
    let databaseConnections = 0;
    try {
      const connectionInfo = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];
      databaseConnections = parseInt(connectionInfo[0]?.count || '0');
    } catch (error) {
      logger.warn('Failed to get database connection count:', error);
    }
    
    // Calculate error rate from recent error logs
    let errorRate = 0;
    try {
      const recentErrors = await prisma.errorLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
          level: 'error',
        },
      });
      errorRate = recentErrors / 5; // Errors per minute
    } catch (error) {
      logger.warn('Failed to calculate error rate:', error);
    }
    
    return {
      memory_usage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpu_usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      active_connections: 0, // Would need to implement connection tracking
      database_connections: databaseConnections,
      error_rate: errorRate,
    };
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics() {
  const memoryUsage = process.memoryUsage();
  return {
    memory_usage: memoryUsage.heapUsed / 1024 / 1024,
    cpu_usage: 0,
    active_connections: 0,
    database_connections: 0,
    error_rate: 0,
  };
}

// Alert system
export class AlertManager {
  private static instance: AlertManager;
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL || '';
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  async sendAlert(
    level: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Log to console
      logger.info(`[${level.toUpperCase()}] ${title}: ${message}`, metadata);

      // Send to Sentry for errors
      if (level === 'error' || level === 'critical') {
        Sentry.captureMessage(`${title}: ${message}`, level as any);
      }

      // Send to Slack webhook if configured
      if (this.webhookUrl && (level === 'error' || level === 'critical')) {
        await this.sendSlackAlert(level, title, message, metadata);
      }

      // Store in database for admin dashboard
      await this.storeAlert(level, title, message, metadata);
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }

  private async sendSlackAlert(
    level: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const color = {
      info: '#36a64f',
      warning: '#ff9500',
      error: '#ff0000',
      critical: '#8b0000',
    }[level];

    const payload = {
      attachments: [
        {
          color,
          title: `🚨 ${title}`,
          text: message,
          fields: metadata
            ? Object.entries(metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          footer: 'Mounasabet Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async storeAlert(
    level: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.systemAlert.create({
        data: {
          type: 'health_check',
          severity: level.toUpperCase(),
          message: `${title}: ${message}`,
          metadata: metadata || {},
          environment: process.env.NODE_ENV || 'development',
          resolved: false,
        },
      });
    } catch (error) {
      logger.error('Failed to store alert in database:', error);
    }
  }
}