import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export interface RequestLoggerOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  excludePaths?: string[];
  slowRequestThreshold?: number; // in milliseconds
}

const defaultOptions: RequestLoggerOptions = {
  logRequests: true,
  logResponses: true,
  logErrors: true,
  excludePaths: ['/api/health', '/api/_next', '/_next'],
  slowRequestThreshold: 1000,
};

export function withRequestLogger(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RequestLoggerOptions = {}
) {
  const config = { ...defaultOptions, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = logger.getRequestId() || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set request ID for this request
    logger.setRequestId(requestId);

    const method = req.method;
    const url = req.url;
    const pathname = new URL(url).pathname;

    // Skip logging for excluded paths
    if (config.excludePaths?.some(path => pathname.startsWith(path))) {
      return handler(req);
    }

    // Extract user context from headers or auth
    const userAgent = req.headers.get('user-agent') || undefined;
    const userId = req.headers.get('x-user-id') || undefined; // Assuming auth middleware sets this
    
    const baseContext = {
      requestId,
      method,
      url: pathname,
      userAgent,
      userId,
    };

    // Log incoming request
    if (config.logRequests) {
      logger.info(`${method} ${pathname}`, {
        ...baseContext,
        component: 'api-request',
      });
    }

    try {
      // Execute the handler
      const response = await handler(req);
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Log response
      if (config.logResponses) {
        const logLevel = statusCode >= 400 ? 'warn' : 'info';
        const logMethod = statusCode >= 400 ? logger.warn : logger.info;
        
        logMethod.call(logger, `${method} ${pathname} - ${statusCode} (${duration}ms)`, {
          ...baseContext,
          statusCode,
          duration,
          component: 'api-response',
        });
      }

      // Log slow requests
      if (config.slowRequestThreshold && duration > config.slowRequestThreshold) {
        logger.performanceWarning(
          `Slow API request: ${method} ${pathname}`,
          duration,
          config.slowRequestThreshold,
          {
            ...baseContext,
            statusCode,
          }
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      if (config.logErrors) {
        logger.apiError(
          method,
          pathname,
          500,
          error instanceof Error ? error : new Error(String(error)),
          {
            ...baseContext,
            duration,
          }
        );
      }

      // Re-throw the error
      throw error;
    }
  };
}

// Utility function to extract user ID from request (customize based on your auth system)
export function extractUserIdFromRequest(req: NextRequest): string | undefined {
  // Try to get user ID from various sources
  
  // From custom header (if set by auth middleware)
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // From JWT token (if using JWT)
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Decode JWT token to get user ID (implement based on your JWT library)
      // const decoded = jwt.decode(token);
      // return decoded?.sub || decoded?.userId;
    }
  } catch {
    // Ignore JWT decode errors
  }

  // From session cookie (if using session-based auth)
  try {
    const sessionCookie = req.cookies.get('session');
    if (sessionCookie) {
      // Decode session to get user ID (implement based on your session system)
      // const session = decodeSession(sessionCookie.value);
      // return session?.userId;
    }
  } catch {
    // Ignore session decode errors
  }

  return undefined;
}

// Enhanced middleware that also sets user context
export function withEnhancedRequestLogger(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RequestLoggerOptions = {}
) {
  return withRequestLogger(async (req: NextRequest) => {
    // Extract and set user context
    const userId = extractUserIdFromRequest(req);
    if (userId) {
      // Create child logger with user context
      const userLogger = logger.child({ userId });
      // You could store this in request context if needed
    }

    return handler(req);
  }, options);
}
