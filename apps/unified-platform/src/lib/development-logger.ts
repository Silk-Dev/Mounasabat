// Development logger implementation
class DevelopmentLogger {
  private static instance: DevelopmentLogger;

  private constructor() {}

  public static getInstance(): DevelopmentLogger {
    if (!DevelopmentLogger.instance) {
      DevelopmentLogger.instance = new DevelopmentLogger();
    }
    return DevelopmentLogger.instance;
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }

  info(message: string, context?: any): void {
    console.info(`[INFO] ${message}`, context || '');
  }

  warn(message: string, context?: any, error?: unknown): void {
    console.warn(`[WARN] ${message}`, context || '', error || '');
  }

  error(message: string, error?: unknown, context?: any): void {
    console.error(`[ERROR] ${message}`, error || '', context || '');
  }

  apiError(method: string, url: string, statusCode: number, error: Error, context?: any): void {
    console.error(`[API ERROR] ${method} ${url} - ${statusCode}: ${error.message}`, context || '');
  }

  userAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    console.info(`[USER ACTION] ${action}`, { userId, metadata });
  }

  componentError(component: string, error: Error, context?: any): void {
    console.error(`[COMPONENT ERROR] ${component}: ${error.message}`, context || '');
  }

  performanceWarning(metric: string, value: number, threshold: number, context?: any): void {
    console.warn(`[PERFORMANCE] ${metric} (${value}ms > ${threshold}ms)`, context || '');
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: any): void {
    console.warn(`[SECURITY] ${event} (${severity})`, context || '');
  }

  databaseQuery(query: string, duration: number, context?: any): void {
    if (duration > 1000) {
      console.warn(`[DB] Slow query (${duration}ms): ${query}`, context || '');
    } else {
      console.debug(`[DB] Query (${duration}ms): ${query}`, context || '');
    }
  }
}
