import * as Sentry from '@sentry/nextjs';
import { logger } from './production-logger';

export interface SentryAlertConfig {
  errorThreshold: number;
  performanceThreshold: number;
  databaseQueryThreshold: number;
  apiResponseThreshold: number;
  errorRateThreshold: number;
  memoryUsageThreshold: number;
}

export interface SentryCustomTags {
  component: string;
  feature: string;
  userRole: string;
  apiEndpoint: string;
  databaseTable: string;
  paymentProvider: string;
  environment: string;
  version: string;
  buildId: string;
  region: string;
}

export class SentryEnhancedConfig {
  private static instance: SentryEnhancedConfig;
  private alertConfig: SentryAlertConfig;
  private isInitialized = false;

  private constructor() {
    this.alertConfig = {
      errorThreshold: parseInt(process.env.SENTRY_ERROR_THRESHOLD || '10'), // errors per minute
      performanceThreshold: parseInt(process.env.SENTRY_PERFORMANCE_THRESHOLD || '2000'), // ms
      databaseQueryThreshold: parseInt(process.env.SENTRY_DB_QUERY_THRESHOLD || '1000'), // ms
      apiResponseThreshold: parseInt(process.env.SENTRY_API_RESPONSE_THRESHOLD || '5000'), // ms
      errorRateThreshold: parseFloat(process.env.SENTRY_ERROR_RATE_THRESHOLD || '0.05'), // 5%
      memoryUsageThreshold: parseInt(process.env.SENTRY_MEMORY_THRESHOLD || '512'), // MB
    };
  }

  static getInstance(): SentryEnhancedConfig {
    if (!SentryEnhancedConfig.instance) {
      SentryEnhancedConfig.instance = new SentryEnhancedConfig();
    }
    return SentryEnhancedConfig.instance;
  }

  initializeEnhancedSentry(): void {
    if (this.isInitialized) return;

    const environment = process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment,

      // Enhanced sampling rates
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      profilesSampleRate: isProduction ? 0.1 : 1.0,

      // Session replay for better debugging
      replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Debug mode for development
      debug: !isProduction,

      // Enhanced beforeSend with custom filtering
      beforeSend: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => {
        return this.enhancedBeforeSend(event, hint);
      },

      // Enhanced beforeSendTransaction for performance events
      beforeSendTransaction: (event: any) => {
        return this.enhancedBeforeSendTransaction(event);
      },

      // Custom integrations
      integrations: [
        // Note: Some integrations may not be available in current Sentry version
        // Sentry.httpIntegration({
        //   breadcrumbs: true,
        // }),
        // Sentry.prismaIntegration(),
        // Sentry.consoleIntegration(),
        // Sentry.replayIntegration({
        //   maskAllText: isProduction,
        //   maskAllInputs: true,
        //   blockAllMedia: true,
        // }),
      ],

      // Enhanced release tracking
      release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

      // Custom tags for better categorization
      initialScope: {
        tags: this.getInitialTags(),
        contexts: {
          app: {
            name: 'mounasabet-unified-platform',
            version: process.env.npm_package_version || '1.0.0',
            build: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
          },
          runtime: {
            name: 'node',
            version: process.version,
          },
        },
      },

      // Enhanced error filtering
      ignoreErrors: [
        // Browser-specific errors
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'Script error.',
        'Network request failed',
        'Load failed',
        'ChunkLoadError',

        // Development-specific errors
        ...(isProduction ? [] : [
          'connect ECONNREFUSED',
          'ENOTFOUND localhost',
        ]),
      ],

      // Enhanced transaction filtering
      ignoreTransactions: [
        // Health check endpoints
        '/api/health',
        '/api/monitoring/health',

        // Static assets
        /\/_next\/static\//,
        /\/favicon\.ico/,
        /\/robots\.txt/,

        // Development hot reload
        ...(isProduction ? [] : [
          '/_next/webpack-hmr',
          '/_next/static/chunks/',
        ]),
      ],

      // Enhanced performance monitoring
      tracesSampler: this.customTracesSampler.bind(this),
    });

    // Set up custom error boundaries
    this.setupCustomErrorBoundaries();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Set up custom alerts
    this.setupCustomAlerts();

    this.isInitialized = true;
    logger.info('Enhanced Sentry monitoring initialized', {
      component: 'sentry',
      environment,
    });
  }

  private getInitialTags(): Partial<SentryCustomTags> {
    return {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      region: process.env.VERCEL_REGION || 'local',
    };
  }

  private enhancedBeforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null {
    // Filter out sensitive information
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
      delete event.request.headers['x-api-key'];
      delete event.request.headers['stripe-signature'];
    }

    // Filter out sensitive data from extra context
    if (event.extra) {
      this.sanitizeEventData(event.extra);
    }

    // Filter out sensitive data from contexts
    if (event.contexts) {
      Object.values(event.contexts).forEach(context => {
        if (context && typeof context === 'object') {
          this.sanitizeEventData(context);
        }
      });
    }

    // Enhanced error categorization
    if (hint.originalException instanceof Error) {
      const error = hint.originalException;

      // Add custom tags based on error type
      event.tags = {
        ...event.tags,
        errorType: error.constructor.name,
        errorCategory: this.categorizeError(error),
      };

      // Skip certain errors in production
      if (process.env.NODE_ENV === 'production') {
        if (this.shouldSkipError(error)) {
          return null;
        }
      }
    }

    // Add performance context
    if (typeof window !== 'undefined' && window.performance) {
      event.contexts = {
        ...event.contexts,
        performance: {
          navigation_type: (performance.navigation as any)?.type || 'unknown',
          connection_type: (navigator as any)?.connection?.effectiveType || 'unknown',
          memory_used: (performance as any)?.memory?.usedJSHeapSize || 0,
        },
      };
    }

    return event;
  }

  private enhancedBeforeSendTransaction(event: any): any | null {
    // Skip transactions that are too fast (likely not meaningful)
    if (event.start_timestamp && event.timestamp) {
      const duration = (event.timestamp - event.start_timestamp) * 1000;
      if (duration < 10) { // Less than 10ms
        return null;
      }

      // Add performance tags
      event.tags = {
        ...event.tags,
        performanceCategory: this.categorizePerformance(duration),
      };

      // Alert on slow transactions
      if (duration > this.alertConfig.performanceThreshold) {
        this.triggerPerformanceAlert(event, duration);
      }
    }

    return event;
  }

  private customTracesSampler(samplingContext: any): number {
    // Default sampling rate
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  }

  private sanitizeEventData(data: any): void {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'csrf', 'stripe', 'payment',
      'card', 'cvv', 'ssn', 'email', 'phone'
    ];

    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          data[key] = '[Filtered]';
        } else if (typeof data[key] === 'object') {
          this.sanitizeEventData(data[key]);
        }
      }
    }
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('prisma')) {
      return 'database';
    }
    if (message.includes('payment') || message.includes('stripe')) {
      return 'payment';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'authentication';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (stack.includes('react') || stack.includes('component')) {
      return 'ui';
    }

    return 'general';
  }

  private categorizePerformance(duration: number): string {
    if (duration < 100) return 'fast';
    if (duration < 500) return 'normal';
    if (duration < 1000) return 'slow';
    if (duration < 3000) return 'very-slow';
    return 'critical';
  }

  private shouldSkipError(error: Error): boolean {
    const skipPatterns = [
      /non-error promise rejection/i,
      /resizeobserver loop limit exceeded/i,
      /script error/i,
      /network request failed/i,
      /load failed/i,
      /chunklloaderror/i,
    ];

    return skipPatterns.some(pattern => pattern.test(error.message));
  }

  private setupCustomErrorBoundaries(): void {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        Sentry.captureException(event.reason, {
          tags: {
            errorBoundary: 'global-unhandled-rejection',
            component: 'window',
          },
        });
      });

      window.addEventListener('error', (event) => {
        Sentry.captureException(event.error, {
          tags: {
            errorBoundary: 'global-error',
            component: 'window',
          },
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined') {
      // Monitor Largest Contentful Paint (LCP)
      this.observePerformanceMetric('largest-contentful-paint', (entry) => {
        const lcp = entry.startTime;
        if (lcp > 2500) { // Poor LCP threshold
          Sentry.addBreadcrumb({
            message: `Poor LCP detected: ${lcp}ms`,
            level: 'warning',
            category: 'performance',
            data: { lcp, threshold: 2500 },
          });
        }
      });

      // Monitor First Input Delay (FID)
      this.observePerformanceMetric('first-input', (entry) => {
        const fid = entry.processingStart - entry.startTime;
        if (fid > 100) { // Poor FID threshold
          Sentry.addBreadcrumb({
            message: `Poor FID detected: ${fid}ms`,
            level: 'warning',
            category: 'performance',
            data: { fid, threshold: 100 },
          });
        }
      });

      // Monitor Cumulative Layout Shift (CLS)
      this.observePerformanceMetric('layout-shift', (entry) => {
        if (!entry.hadRecentInput && entry.value > 0.1) { // Poor CLS threshold
          Sentry.addBreadcrumb({
            message: `Layout shift detected: ${entry.value}`,
            level: 'warning',
            category: 'performance',
            data: { cls: entry.value, threshold: 0.1 },
          });
        }
      });
    }
  }

  private observePerformanceMetric(type: string, callback: (entry: any) => void): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        observer.observe({ type, buffered: true });
      } catch (error) {
        // PerformanceObserver not supported or type not available
        logger.warn(`Performance observer for ${type} not supported`, { error });
      }
    }
  }

  private setupCustomAlerts(): void {
    // Set up error rate monitoring
    this.setupErrorRateMonitoring();

    // Set up performance alerts
    this.setupPerformanceAlerts();

    // Set up memory usage monitoring
    this.setupMemoryMonitoring();
  }

  private setupErrorRateMonitoring(): void {
    let errorCount = 0;
    let totalRequests = 0;
    const windowSize = 5 * 60 * 1000; // 5 minutes

    setInterval(() => {
      if (totalRequests > 0) {
        const errorRate = errorCount / totalRequests;
        if (errorRate > this.alertConfig.errorRateThreshold) {
          Sentry.captureMessage(
            `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
            'warning'
          );

          logger.warn('High error rate detected', {
            component: 'sentry-monitoring',
            errorRate,
            errorCount,
            totalRequests,
            threshold: this.alertConfig.errorRateThreshold,
          });
        }
      }

      // Reset counters
      errorCount = 0;
      totalRequests = 0;
    }, windowSize);

    // Hook into Sentry to count errors
    Sentry.addEventProcessor((event) => {
      totalRequests++;
      if (event.level === 'error') {
        errorCount++;
      }
      return event;
    });
  }

  private setupPerformanceAlerts(): void {
    // Monitor API response times
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = performance.now();
        try {
          const response = await originalFetch(...args);
          const duration = performance.now() - start;

          if (duration > this.alertConfig.apiResponseThreshold) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as any).url;
            this.triggerApiPerformanceAlert(url, duration);
          }

          return response;
        } catch (error) {
          const duration = performance.now() - start;
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as any).url;

          Sentry.captureException(error, {
            tags: {
              component: 'api-request',
              url,
            },
            extra: {
              duration,
              requestArgs: args,
            },
          });

          throw error;
        }
      };
    }
  }

  private setupMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        if (usedMB > this.alertConfig.memoryUsageThreshold) {
          Sentry.captureMessage(
            `High memory usage detected: ${usedMB.toFixed(2)}MB`,
            'warning'
          );

          logger.warn('High memory usage detected', {
            component: 'sentry-monitoring',
            memoryUsage: usedMB,
            threshold: this.alertConfig.memoryUsageThreshold,
            totalHeapSize: memory.totalJSHeapSize / 1024 / 1024,
            heapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024,
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private triggerPerformanceAlert(event: any, duration: number): void {
    logger.warn('Slow transaction detected', {
      component: 'sentry-monitoring',
      transactionName: event.transaction,
      duration,
      threshold: this.alertConfig.performanceThreshold,
    });
  }

  private triggerApiPerformanceAlert(url: string, duration: number): void {
    Sentry.captureMessage(
      `Slow API response: ${url} took ${duration.toFixed(2)}ms`,
      'warning'
    );

    logger.warn('Slow API response detected', {
      component: 'sentry-monitoring',
      url,
      duration,
      threshold: this.alertConfig.apiResponseThreshold,
    });
  }

  // Public methods for custom tagging
  setCustomTags(tags: Partial<SentryCustomTags>): void {
    Sentry.setTags(tags);
  }

  setUserContext(user: { id: string; email?: string; role?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    this.setCustomTags({
      userRole: user.role || 'unknown',
    });
  }

  setComponentContext(component: string, feature?: string): void {
    this.setCustomTags({
      component,
      feature: feature || 'unknown',
    });
  }

  setApiContext(endpoint: string, method: string): void {
    this.setCustomTags({
      apiEndpoint: `${method} ${endpoint}`,
    });
  }

  setDatabaseContext(table: string, operation: string): void {
    this.setCustomTags({
      databaseTable: table,
    });

    Sentry.addBreadcrumb({
      message: `Database ${operation} on ${table}`,
      level: 'info',
      category: 'database',
      data: { table, operation },
    });
  }

  setPaymentContext(provider: string, operation: string): void {
    this.setCustomTags({
      paymentProvider: provider,
    });

    Sentry.addBreadcrumb({
      message: `Payment ${operation} with ${provider}`,
      level: 'info',
      category: 'payment',
      data: { provider, operation },
    });
  }

  // Method to manually trigger alerts for testing
  triggerTestAlert(type: 'error' | 'performance' | 'memory'): void {
    switch (type) {
      case 'error':
        Sentry.captureException(new Error('Test error alert from Sentry monitoring'));
        break;
      case 'performance':
        Sentry.captureMessage('Test performance alert from Sentry monitoring', 'warning');
        break;
      case 'memory':
        Sentry.captureMessage('Test memory usage alert from Sentry monitoring', 'warning');
        break;
    }
  }
}

// Export singleton instance
export const sentryConfig = SentryEnhancedConfig.getInstance();

// Initialize enhanced Sentry configuration
export function initializeEnhancedSentry(): void {
  sentryConfig.initializeEnhancedSentry();
}
