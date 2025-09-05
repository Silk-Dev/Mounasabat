import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RateLimitError } from './rate-limiter';
import { CSRFProtection, RequestValidator, InputSanitizer } from './security';
import { auditLogger, AuditEventType, AuditLogLevel } from './audit-logger';
import { logger } from './logger';
import { z } from 'zod';

// Security configuration for different endpoint types
export interface SecurityConfig {
  rateLimitType?: 'api' | 'auth' | 'booking' | 'search' | 'upload' | 'admin';
  requireAuth?: boolean;
  allowedRoles?: string[];
  enableCSRF?: boolean;
  validateOrigin?: boolean;
  maxRequestSize?: number;
  sanitizeInput?: boolean;
  logRequests?: boolean;
}

// Default security configurations
const defaultConfigs: Record<string, SecurityConfig> = {
  auth: {
    rateLimitType: 'auth',
    requireAuth: false,
    enableCSRF: true,
    validateOrigin: true,
    maxRequestSize: 1024 * 1024, // 1MB
    sanitizeInput: true,
    logRequests: true,
  },
  booking: {
    rateLimitType: 'booking',
    requireAuth: true,
    allowedRoles: ['customer', 'admin'],
    enableCSRF: true,
    validateOrigin: true,
    maxRequestSize: 5 * 1024 * 1024, // 5MB
    sanitizeInput: true,
    logRequests: true,
  },
  admin: {
    rateLimitType: 'admin',
    requireAuth: true,
    allowedRoles: ['admin'],
    enableCSRF: true,
    validateOrigin: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    sanitizeInput: true,
    logRequests: true,
  },
  provider: {
    rateLimitType: 'api',
    requireAuth: true,
    allowedRoles: ['provider', 'admin'],
    enableCSRF: true,
    validateOrigin: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    sanitizeInput: true,
    logRequests: true,
  },
  public: {
    rateLimitType: 'search',
    requireAuth: false,
    enableCSRF: false,
    validateOrigin: false,
    maxRequestSize: 1024 * 1024, // 1MB
    sanitizeInput: true,
    logRequests: false,
  },
};

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Create standardized API response
export function createAPIResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  requestId?: string
): APIResponse<T> {
  return {
    success,
    ...(data && { data }),
    ...(error && { error }),
    ...(message && { message }),
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

// Security middleware wrapper for API routes
export function withSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Apply rate limiting
      if (config.rateLimitType) {
        try {
          const rateLimitResult = await rateLimiter.createMiddleware(config.rateLimitType)(request);
          
          if (!rateLimitResult.allowed) {
            await auditLogger.logFromRequest(request, {
              level: AuditLogLevel.WARNING,
              eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
              action: 'rate_limit_exceeded',
              description: `Rate limit exceeded for ${request.nextUrl.pathname}`,
              success: false,
              metadata: { 
                requestId,
                rateLimitType: config.rateLimitType,
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime,
              },
            });

            const response = NextResponse.json(
              createAPIResponse(false, null, 'Rate limit exceeded', 'Too many requests. Please try again later.', requestId),
              { status: 429 }
            );

            // Add rate limit headers
            Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });

            return response;
          }

          // Add rate limit headers to successful responses
          Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
            request.headers.set(`x-ratelimit-${key.toLowerCase()}`, value);
          });
        } catch (rateLimitError) {
          logger.error('Rate limiting error:', rateLimitError);
          // Continue without rate limiting on error
        }
      }

      // Validate origin for state-changing requests
      if (config.validateOrigin && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const allowedOrigins = [
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
          'http://localhost:3000',
          'http://localhost:3001',
        ].filter(Boolean);

        if (!RequestValidator.validateOrigin(request, allowedOrigins)) {
          await auditLogger.logFromRequest(request, {
            level: AuditLogLevel.WARNING,
            eventType: AuditEventType.SECURITY_VIOLATION,
            action: 'invalid_origin',
            description: `Invalid origin for ${request.nextUrl.pathname}`,
            success: false,
            metadata: { 
              requestId,
              origin: request.headers.get('origin'),
              referer: request.headers.get('referer'),
            },
          });

          return NextResponse.json(
            createAPIResponse(false, null, 'Invalid origin', 'Request origin not allowed', requestId),
            { status: 403 }
          );
        }
      }

      // CSRF protection for state-changing requests
      if (config.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const isValidCSRF = await CSRFProtection.validateRequest(request);
        
        if (!isValidCSRF) {
          await auditLogger.logFromRequest(request, {
            level: AuditLogLevel.WARNING,
            eventType: AuditEventType.SECURITY_VIOLATION,
            action: 'csrf_validation_failed',
            description: `CSRF validation failed for ${request.nextUrl.pathname}`,
            success: false,
            metadata: { requestId },
          });

          return NextResponse.json(
            createAPIResponse(false, null, 'CSRF validation failed', 'Invalid or missing CSRF token', requestId),
            { status: 403 }
          );
        }
      }

      // Request size validation
      if (config.maxRequestSize && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const isValidSize = await RequestValidator.validateRequestSize(request, config.maxRequestSize);
        
        if (!isValidSize) {
          await auditLogger.logFromRequest(request, {
            level: AuditLogLevel.WARNING,
            eventType: AuditEventType.SECURITY_VIOLATION,
            action: 'request_too_large',
            description: `Request too large for ${request.nextUrl.pathname}`,
            success: false,
            metadata: { 
              requestId,
              maxSize: config.maxRequestSize,
              contentLength: request.headers.get('content-length'),
            },
          });

          return NextResponse.json(
            createAPIResponse(false, null, 'Request too large', 'Request payload exceeds maximum allowed size', requestId),
            { status: 413 }
          );
        }
      }

      // Content type validation for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const allowedContentTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain',
        ];
        
        if (!RequestValidator.validateContentType(request, allowedContentTypes)) {
          await auditLogger.logFromRequest(request, {
            level: AuditLogLevel.WARNING,
            eventType: AuditEventType.SECURITY_VIOLATION,
            action: 'invalid_content_type',
            description: `Invalid content type for ${request.nextUrl.pathname}`,
            success: false,
            metadata: { 
              requestId,
              contentType: request.headers.get('content-type'),
            },
          });

          return NextResponse.json(
            createAPIResponse(false, null, 'Invalid content type', 'Unsupported content type', requestId),
            { status: 400 }
          );
        }
      }

      // Log request if enabled
      if (config.logRequests) {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.INFO,
          eventType: AuditEventType.API_REQUEST,
          action: 'api_request',
          description: `API request to ${request.nextUrl.pathname}`,
          success: true,
          metadata: { 
            requestId,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
          },
        });
      }

      // Add request ID to headers for tracking
      const requestWithId = new NextRequest(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-request-id': requestId,
        },
      });

      // Call the actual handler
      const response = await handler(requestWithId, ...args);

      // Add security headers to response
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');

      // Log successful response
      if (config.logRequests) {
        const duration = Date.now() - startTime;
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.INFO,
          eventType: AuditEventType.API_REQUEST,
          action: 'api_response',
          description: `API response for ${request.nextUrl.pathname}`,
          success: response.status < 400,
          metadata: { 
            requestId,
            status: response.status,
            duration,
          },
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('API security middleware error:', error);

      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.ERROR,
        eventType: AuditEventType.API_REQUEST,
        action: 'api_error',
        description: `API error for ${request.nextUrl.pathname}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: { 
          requestId,
          duration,
        },
      });

      // Handle specific error types
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          createAPIResponse(false, null, 'Rate limit exceeded', error.message, requestId),
          { status: 429 }
        );
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          createAPIResponse(
            false, 
            null, 
            'Validation error', 
            'Invalid request data',
            requestId
          ),
          { status: 400 }
        );
      }

      // Generic error response
      return NextResponse.json(
        createAPIResponse(
          false, 
          null, 
          'Internal server error', 
          'An unexpected error occurred',
          requestId
        ),
        { status: 500 }
      );
    }
  };
}

// Convenience wrappers for common configurations
export const withAuthSecurity = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => withSecurity(handler, defaultConfigs.auth);

export const withBookingSecurity = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => withSecurity(handler, defaultConfigs.booking);

export const withAdminSecurity = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => withSecurity(handler, defaultConfigs.admin);

export const withProviderSecurity = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => withSecurity(handler, defaultConfigs.provider);

export const withPublicSecurity = <T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) => withSecurity(handler, defaultConfigs.public);

// Input sanitization middleware
export function sanitizeRequestBody(body: any): any {
  if (typeof body === 'string') {
    return InputSanitizer.sanitizeGeneral(body);
  }
  
  if (Array.isArray(body)) {
    return body.map(sanitizeRequestBody);
  }
  
  if (body && typeof body === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      sanitized[key] = sanitizeRequestBody(value);
    }
    return sanitized;
  }
  
  return body;
}

// Enhanced error handler for API routes
export function handleAPIError(error: unknown, requestId?: string): NextResponse {
  logger.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      createAPIResponse(
        false,
        null,
        'Validation error',
        'Invalid request data',
        requestId
      ),
      { status: 400 }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      createAPIResponse(
        false,
        null,
        'Rate limit exceeded',
        error.message,
        requestId
      ),
      { status: 429 }
    );
  }

  // Generic error
  return NextResponse.json(
    createAPIResponse(
      false,
      null,
      'Internal server error',
      'An unexpected error occurred',
      requestId
    ),
    { status: 500 }
  );
}
