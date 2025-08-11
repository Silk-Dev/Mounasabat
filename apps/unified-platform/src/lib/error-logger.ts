interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  section?: string;
  userRole?: string;
  additionalData?: Record<string, any>;
}

interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warn' | 'info';
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

class ErrorLogger {
  private errorQueue: ErrorLog[] = [];
  private isOnline = true;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Monitor online status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushErrors();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Flush errors periodically
      this.flushInterval = setInterval(() => {
        this.flushErrors();
      }, 30000); // Every 30 seconds

      // Flush errors before page unload
      window.addEventListener('beforeunload', () => {
        this.flushErrors();
      });
    }
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.message}-${error.stack?.split('\n')[0]}-${context.section || 'unknown'}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private getContext(): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
      
      // Get user info from localStorage/sessionStorage
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          context.userId = parsed.id;
          context.userRole = parsed.role;
        }
        
        context.sessionId = sessionStorage.getItem('sessionId') || undefined;
      } catch {
        // Ignore errors when accessing storage
      }
    }

    return context;
  }

  private async sendToServer(errors: ErrorLog[]): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      console.warn('Failed to send errors to server:', error);
      throw error;
    }
  }

  private storeLocally(errors: ErrorLog[]): void {
    try {
      const stored = localStorage.getItem('errorLogs');
      const existingErrors = stored ? JSON.parse(stored) : [];
      const combined = [...existingErrors, ...errors];
      
      // Keep only last 100 errors
      const trimmed = combined.slice(-100);
      localStorage.setItem('errorLogs', JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];

    if (this.isOnline) {
      try {
        await this.sendToServer(errorsToFlush);
      } catch {
        // If server fails, store locally and re-queue
        this.storeLocally(errorsToFlush);
        this.errorQueue.unshift(...errorsToFlush);
      }
    } else {
      // Store locally when offline
      this.storeLocally(errorsToFlush);
      this.errorQueue.unshift(...errorsToFlush);
    }
  }

  async logError(
    error: Error,
    level: 'error' | 'warn' | 'info' = 'error',
    additionalContext?: Partial<ErrorContext>
  ): Promise<void> {
    const context = { ...this.getContext(), ...additionalContext };
    const fingerprint = this.generateFingerprint(error, context);
    const timestamp = new Date().toISOString();

    // Check if we already have this error
    const existingError = this.errorQueue.find(e => e.fingerprint === fingerprint);
    
    if (existingError) {
      existingError.count++;
      existingError.lastSeen = timestamp;
      existingError.context = { ...existingError.context, ...context };
    } else {
      const errorLog: ErrorLog = {
        id: crypto.randomUUID(),
        message: error.message,
        stack: error.stack,
        level,
        context,
        fingerprint,
        count: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
      };

      this.errorQueue.push(errorLog);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: error.message,
        stack: error.stack,
        context,
        level,
      });
    }

    // Flush immediately for critical errors
    if (level === 'error' && this.isOnline) {
      await this.flushErrors();
    }
  }

  async logAPIError(
    url: string,
    method: string,
    status: number,
    response: any,
    additionalContext?: Partial<ErrorContext>
  ): Promise<void> {
    const error = new Error(`API Error: ${method} ${url} - ${status}`);
    await this.logError(error, 'error', {
      ...additionalContext,
      section: 'api',
      additionalData: {
        url,
        method,
        status,
        response,
      },
    });
  }

  async logUserAction(
    action: string,
    details?: Record<string, any>,
    level: 'info' | 'warn' = 'info'
  ): Promise<void> {
    const error = new Error(`User Action: ${action}`);
    await this.logError(error, level, {
      section: 'user-action',
      additionalData: details,
    });
  }

  async logPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    additionalContext?: Partial<ErrorContext>
  ): Promise<void> {
    const error = new Error(`Performance Issue: ${metric} (${value}ms > ${threshold}ms)`);
    await this.logError(error, 'warn', {
      ...additionalContext,
      section: 'performance',
      additionalData: {
        metric,
        value,
        threshold,
      },
    });
  }

  getStoredErrors(): ErrorLog[] {
    try {
      const stored = localStorage.getItem('errorLogs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    try {
      localStorage.removeItem('errorLogs');
    } catch {
      // Ignore storage errors
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushErrors();
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'error',
      { section: 'unhandled-promise' }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorLogger.logError(
      new Error(event.message),
      'error',
      {
        section: 'global-error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }
    );
  });
}

export type { ErrorLog, ErrorContext };