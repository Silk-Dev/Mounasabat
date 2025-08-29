import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  environment?: string;
  errorRate?: number;
  memoryUsage?: number;
  threshold?: number;
  transactionName?: string;
  error?: any;
  errorCount?: number;
  totalRequests?: number;
  totalHeapSize?: number;
  heapSizeLimit?: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ProductionLogger {
  private static instance: ProductionLogger;
  private requestId: string | null = null;
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private constructor() {
    // Initialize request ID for server-side logging
    if (typeof window === 'undefined') {
      this.requestId = this.generateRequestId();
    }
  }

  public static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  // Simple implementation for development environment
  private devLog(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    const errorStr = error ? JSON.stringify(error) : '';
    
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, contextStr, errorStr);
  }

  private generateRequestId(): string {
    // Generate a simple request ID using timestamp and random number
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private getBaseContext(): LogContext {
    const context: LogContext = {
      requestId: this.requestId || this.generateRequestId(),
    };

    // Client-side context
    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;

      // Get user info from auth context or localStorage
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          context.userId = parsed.id;
        }

        context.sessionId = sessionStorage.getItem('sessionId') || undefined;
      } catch {
        // Ignore errors when accessing storage
      }
    }

    return context;
  }

  private formatLogMessage(level: LogLevel, message: string, context: LogContext): string {
    const timestamp = new Date().toISOString();
    const requestId = context.requestId || 'unknown';
    const userId = context.userId || 'anonymous';

    return `[${timestamp}] [${level.toUpperCase()}] [${requestId}] [${userId}] ${message}`;
  }

  private logToConsole(level: LogLevel, message: string, context: LogContext, error?: Error): void {
    if (!this.isDevelopment) return;

    const formattedMessage = this.formatLogMessage(level, message, context);
    const logData = {
      context,
      ...(error && { error: { name: error.name, message: error.message, stack: error.stack } }),
    };

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, logData);
        break;
      case 'info':
        console.info(formattedMessage, logData);
        break;
      case 'warn':
        console.warn(formattedMessage, logData);
        break;
      case 'error':
        console.error(formattedMessage, logData);
        break;
    }
  }

  private logToSentry(level: LogLevel, message: string, context: LogContext, error?: Error): void {
    // Import enhanced Sentry config
    import('./sentry-config').then(({ sentryConfig }) => {
      // Set enhanced context
      if (context.component) {
        sentryConfig.setComponentContext(context.component, context.action);
      }
      
      if (context.userId) {
        sentryConfig.setUserContext({ id: context.userId });
      }
      
      if (context.url && context.method) {
        sentryConfig.setApiContext(context.url, context.method);
      }
    }).catch(() => {
      // Fallback to basic Sentry logging if enhanced config fails
    });

    // Set Sentry context
    Sentry.setContext('logging', {
      level,
      requestId: context.requestId,
      userId: context.userId,
      sessionId: context.sessionId,
      component: context.component,
      action: context.action,
      url: context.url,
      method: context.method,
      statusCode: context.statusCode,
      duration: context.duration,
      metadata: context.metadata,
    });

    // Set user context if available
    if (context.userId) {
      Sentry.setUser({ id: context.userId });
    }

    // Set enhanced tags for better filtering
    Sentry.setTags({
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      requestId: context.requestId || 'unknown',
      logLevel: level,
      environment: process.env.NODE_ENV || 'development',
      feature: context.metadata?.feature || 'unknown',
    });

    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      message,
      level: level === 'warn' ? 'warning' : level,
      category: context.component || 'general',
      data: {
        action: context.action,
        url: context.url,
        method: context.method,
        statusCode: context.statusCode,
        duration: context.duration,
      },
    });

    if (error) {
      // Log errors to Sentry with enhanced context
      Sentry.captureException(error, {
        level: level === 'warn' ? 'warning' : level,
        tags: {
          errorCategory: this.categorizeError(error),
          errorType: error.constructor.name,
        },
        extra: {
          message,
          context,
          errorStack: error.stack,
        },
        fingerprint: [
          error.message,
          context.component || 'unknown',
          context.action || 'unknown',
        ],
      });
    } else {
      // Log messages to Sentry with enhanced context
      Sentry.captureMessage(message, {
        level: level === 'warn' ? 'warning' : level,
        tags: {
          messageCategory: this.categorizeMessage(message, context),
        },
        extra: {
          context,
        },
        fingerprint: [
          message,
          context.component || 'unknown',
          level,
        ],
      });
    }
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('prisma') || stack.includes('prisma')) {
      return 'database';
    }
    if (message.includes('payment') || message.includes('stripe')) {
      return 'payment';
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (stack.includes('react') || stack.includes('component') || stack.includes('jsx')) {
      return 'ui';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'authorization';
    }

    return 'general';
  }

  private categorizeMessage(message: string, context: LogContext): string {
    const lowerMessage = message.toLowerCase();
    
    if (context.component === 'api') return 'api';
    if (context.component === 'database') return 'database';
    if (context.component === 'payment') return 'payment';
    if (context.component === 'auth') return 'authentication';
    
    if (lowerMessage.includes('user action')) return 'user-interaction';
    if (lowerMessage.includes('performance')) return 'performance';
    if (lowerMessage.includes('security')) return 'security';
    if (lowerMessage.includes('system')) return 'system';
    
    return 'general';
  }

  private async logToDatabase(level: LogLevel, message: string, context: LogContext, error?: Error): Promise<void> {
    // Only log errors and warnings to database to avoid spam
    if (level !== 'error' && level !== 'warn') return;

    try {
      // Import Prisma dynamically to avoid issues in edge runtime
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Generate fingerprint for deduplication
      const fingerprint = this.generateFingerprint(message, context, error);

      // Try to find existing error log
      const existingLog = await prisma.errorLog.findUnique({
        where: { fingerprint },
      });

      if (existingLog) {
        // Update existing log
        await prisma.errorLog.update({
          where: { fingerprint },
          data: {
            count: existingLog.count + 1,
            lastSeen: new Date(),
            context: context as any,
          },
        });
      } else {
        // Create new log entry
        await prisma.errorLog.create({
          data: {
            level,
            message,
            stack: error?.stack,
            context: context as any,
            fingerprint,
            count: 1,
            firstSeen: new Date(),
            lastSeen: new Date(),
          },
        });
      }

      await prisma.$disconnect();
    } catch (dbError) {
      // Fallback to console if database logging fails
      if (this.isDevelopment) {
        console.error('Failed to log to database:', dbError);
      }
    }
  }

  private generateFingerprint(message: string, context: LogContext, error?: Error): string {
    const key = `${message}-${error?.stack?.split('\n')[0] || ''}-${context.component || 'unknown'}`;
    // Create a simple hash from the key
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const fullContext = { ...this.getBaseContext(), ...context };

    // Always log to console in development
    this.logToConsole(level, message, fullContext, error);

    // Log to Sentry in production or for errors/warnings
    if (this.isProduction || level === 'error' || level === 'warn') {
      this.logToSentry(level, message, fullContext, error);
    }

    // Log to database for errors and warnings
    if (level === 'error' || level === 'warn') {
      this.logToDatabase(level, message, fullContext, error).catch(() => {
        // Ignore database logging errors
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    const errorObj = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.log('warn', message, context, errorObj);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, context, errorObj);
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      component: 'api',
    });
  }

  apiError(method: string, url: string, statusCode: number, error: Error, context?: LogContext): void {
    this.error(`API ${method} ${url} - ${statusCode}: ${error.message}`, error, {
      ...context,
      method,
      url,
      statusCode,
      component: 'api',
    });
  }

  userAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      component: 'user-action',
      metadata,
    });
  }

  componentError(component: string, error: Error, context?: LogContext): void {
    this.error(`Component error in ${component}: ${error.message}`, error, {
      ...context,
      component,
    });
  }

  performanceWarning(metric: string, value: number, threshold: number, context?: LogContext): void {
    this.warn(`Performance warning: ${metric} (${value}ms > ${threshold}ms)`, context, new Error({
      component: 'performance',
      metadata: { metric, value, threshold },
    }));
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this.log(level, `Security event: ${event}`, {
      ...context,
      component: 'security',
      metadata: { severity },
    });
  }

  databaseQuery(query: string, duration: number, context?: LogContext): void {
    if (duration > 1000) {
      this.warn(`Slow database query (${duration}ms): ${query}`, undefined, {
        ...context,
        component: 'database',
        metadata: { query, duration },
      });
    } else {
      this.debug(`Database query (${duration}ms): ${query}`, {
        ...context,
        component: 'database',
        metadata: { query, duration },
      });
    }
  }

  // Request context management
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  getRequestId(): string | null {
    return this.requestId;
  }

  // Create child logger with additional context
  child(context: LogContext): ProductionLogger {
    const childLogger = Object.create(this);
    childLogger.getBaseContext = () => ({
      ...this.getBaseContext(),
      ...context,
    });
    return childLogger;
  }
}

// Export singleton instance
const loggerInstance = ProductionLogger.getInstance();

export { loggerInstance as logger };

// Export class for testing
export { ProductionLogger };

// Convenience functions for backward compatibility
export const log = {
  debug: (message: string, context?: LogContext) => loggerInstance.debug(message, context),
  info: (message: string, context?: LogContext) => loggerInstance.info(message, context),
  warn: (message: string, context?: LogContext, error?: unknown) => loggerInstance.warn(message, context, error),
  error: (message: string, error?: unknown, context?: LogContext) => loggerInstance.error(message, error, context),
};
