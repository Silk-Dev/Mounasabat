import * as Sentry from '@sentry/nextjs';

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

// Application health check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    redis: boolean;
    external_apis: boolean;
  };
  metrics: {
    memory_usage: number;
    cpu_usage: number;
    active_connections: number;
    response_time_avg: number;
  };
}

export async function performHealthCheck(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbCheck = await checkDatabase();
    
    // Check Redis connectivity
    const redisCheck = await checkRedis();
    
    // Check external APIs
    const apiCheck = await checkExternalAPIs();
    
    // Get system metrics
    const metrics = await getSystemMetrics();
    
    const allChecksPass = dbCheck && redisCheck && apiCheck;
    
    return {
      status: allChecksPass ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
        external_apis: apiCheck,
      },
      metrics: {
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpu_usage: metrics.cpuUsage,
        active_connections: metrics.activeConnections,
        response_time_avg: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: false,
        redis: false,
        external_apis: false,
      },
      metrics: {
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage: 0,
        active_connections: 0,
        response_time_avg: Date.now() - startTime,
      },
    };
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    if (!process.env.REDIS_URL) return true; // Skip if Redis not configured
    
    const { Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    redis.disconnect();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

async function checkExternalAPIs(): Promise<boolean> {
  try {
    // Check Stripe API
    if (process.env.STRIPE_SECRET_KEY) {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      });
      if (!response.ok) return false;
    }
    
    return true;
  } catch (error) {
    console.error('External API health check failed:', error);
    return false;
  }
}

async function getSystemMetrics() {
  return {
    cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
    activeConnections: 0, // Would need to implement connection tracking
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
      console.log(`[${level.toUpperCase()}] ${title}: ${message}`, metadata);

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
      console.error('Failed to send alert:', error);
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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.systemAlert.create({
        data: {
          level,
          title,
          message,
          metadata: metadata || {},
          isResolved: false,
        },
      });
      
      await prisma.$disconnect();
    } catch (error) {
      console.error('Failed to store alert in database:', error);
    }
  }
}