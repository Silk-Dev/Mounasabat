import { NextRequest, NextResponse } from 'next/server';
import { errorHandler } from './production-error-handler';
import { logger } from './logger';
import { ApiResponseBuilder, type ApiResponse, type ErrorResponse, sanitizeInput } from './api-response';

export interface ApiRouteContext {
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
}

export type ApiRouteHandler<T = any> = (
  request: NextRequest,
  context?: ApiRouteContext
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Middleware wrapper for API routes that provides:
 * - Standardized error handling
 * - Request/response logging
 * - Performance monitoring
 * - Automatic error sanitization
 */
export function withApiMiddleware<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
    requireAuth?: boolean;
    rateLimit?: number;
    logRequests?: boolean;
  }
) {
  return async (
    request: NextRequest,
    context?: ApiRouteContext
  ): Promise<NextResponse<ApiResponse<T> | ErrorResponse>> => {
    const startTime = Date.now();
    const component = options?.component || 'api';
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set request ID for logging
    logger.setRequestId(requestId);

    try {
      // Log incoming request if enabled
      if (options?.logRequests !== false) {
        logger.apiRequest(
          request.method,
          request.url,
          0, // Status code will be logged after response
          0, // Duration will be calculated after response
          {
            requestId,
            component,
            userAgent: request.headers.get('user-agent') || undefined,
          }
        );
      }

      // Execute the handler
      const response = await handler(request, context);
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log successful response
      if (options?.logRequests !== false) {
        logger.apiRequest(
          request.method,
          request.url,
          response.status,
          duration,
          {
            requestId,
            component,
          }
        );
      }

      // Add performance warning if request is slow
      if (duration > 2000) {
        logger.performanceWarning(
          'slow_api_request',
          duration,
          2000,
          {
            requestId,
            component,
            url: request.url,
            method: request.method,
          }
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle the error using the production error handler
      const errorResponse = errorHandler.handleAPIError(
        error instanceof Error ? error : new Error(String(error)),
        request,
        {
          requestId,
          component,
          duration,
        }
      );

      return errorResponse;
    }
  };
}

/**
 * Middleware for routes that require authentication
 */
export function withAuth<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
    roles?: string[];
  }
) {
  return withApiMiddleware(async (request, context) => {
    // Import auth dynamically to avoid circular dependencies
    const { auth } = await import('./auth');
    const { headers } = await import('next/headers');
    
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      
      if (!session?.user) {
        return ApiResponseBuilder.unauthorized('Authentication required');
      }

      // Check role requirements if specified
      if (options?.roles && !options.roles.includes(session.user.role)) {
        return ApiResponseBuilder.forbidden('Insufficient permissions');
      }

      // Add user context to request
      (request as any).user = session.user;
      
      return await handler(request, context);
    } catch (authError) {
      logger.error('Authentication error', authError instanceof Error ? authError : new Error(String(authError)), {
        component: options?.component || 'auth_middleware',
        url: request.url,
        method: request.method,
      });
      
      return ApiResponseBuilder.unauthorized('Authentication failed');
    }
  }, {
    component: options?.component,
    requireAuth: true,
  });
}

/**
 * Middleware for admin-only routes
 */
export function withAdminAuth<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
  }
) {
  return withAuth(handler, {
    ...options,
    roles: ['admin'],
  });
}

/**
 * Middleware for provider-only routes
 */
export function withProviderAuth<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
  }
) {
  return withAuth(handler, {
    ...options,
    roles: ['provider', 'admin'],
  });
}

/**
 * Middleware for validating and sanitizing request body
 */
export function withValidation<T = any>(
  handler: ApiRouteHandler<T>,
  validator: (body: any) => { isValid: boolean; errors?: string[] },
  options?: {
    component?: string;
    sanitizeInput?: boolean;
    maxBodySize?: number;
  }
) {
  return withApiMiddleware(async (request, context) => {
    try {
      // Check content length if specified
      if (options?.maxBodySize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > options.maxBodySize) {
          return ApiResponseBuilder.error(
            'Request Too Large',
            413,
            'Request body exceeds maximum allowed size',
            'REQUEST_TOO_LARGE'
          );
        }
      }

      const body = await request.json();
      
      // Sanitize input if enabled
      const sanitizedBody = options?.sanitizeInput !== false 
        ? sanitizeInput(body) 
        : body;
      
      const validation = validator(sanitizedBody);
      
      if (!validation.isValid) {
        return ApiResponseBuilder.validationError(
          { errors: validation.errors },
          'Request validation failed'
        );
      }

      // Add validated and sanitized body to request
      (request as any).validatedBody = sanitizedBody;
      
      return await handler(request, context);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        return ApiResponseBuilder.validationError(
          { error: 'Invalid JSON format' },
          'Request body must be valid JSON'
        );
      }
      
      logger.error('Request validation error:', parseError, {
        component: options?.component || 'validation_middleware',
        url: request.url,
        method: request.method,
      });
      
      return ApiResponseBuilder.error(
        'Validation Error',
        400,
        'Failed to process request body',
        'VALIDATION_ERROR'
      );
    }
  }, {
    component: options?.component,
  });
}

/**
 * Middleware for input sanitization
 */
export function withInputSanitization<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
    sanitizeQuery?: boolean;
    sanitizeBody?: boolean;
  }
) {
  return withApiMiddleware(async (request, context) => {
    // Sanitize query parameters if enabled
    if (options?.sanitizeQuery !== false) {
      const url = new URL(request.url);
      const sanitizedParams = new URLSearchParams();
      
      for (const [key, value] of url.searchParams.entries()) {
        const sanitizedKey = sanitizeInput(key);
        const sanitizedValue = sanitizeInput(value);
        sanitizedParams.set(sanitizedKey, sanitizedValue);
      }
      
      // Update the request URL with sanitized parameters
      url.search = sanitizedParams.toString();
      (request as any).url = url.toString();
    }

    // Sanitize request body if it exists and sanitization is enabled
    if (options?.sanitizeBody !== false && request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.json();
        const sanitizedBody = sanitizeInput(body);
        (request as any).sanitizedBody = sanitizedBody;
      } catch (error) {
        // If body parsing fails, continue without sanitization
        // The actual handler will deal with the parsing error
      }
    }

    return await handler(request, context);
  }, {
    component: options?.component,
  });
}

/**
 * Middleware for rate limiting with enhanced security
 */
export function withRateLimit<T = any>(
  handler: ApiRouteHandler<T>,
  options?: {
    component?: string;
    requestsPerMinute?: number;
    requestsPerHour?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: NextRequest) => string;
  }
) {
  return withApiMiddleware(async (request, context) => {
    // Import rate limiter dynamically to avoid circular dependencies
    const { checkRateLimit } = await import('@/lib/rate-limiter');
    
    const rateLimitKey = options?.keyGenerator 
      ? options.keyGenerator(request)
      : `${request.method}:${new URL(request.url).pathname}:${request.headers.get('x-forwarded-for') || 'unknown'}`;
    
    const rateLimitResult = await checkRateLimit(rateLimitKey, {
      requestsPerMinute: options?.requestsPerMinute || 60,
      requestsPerHour: options?.requestsPerHour || 1000,
    });
    
    if (!rateLimitResult.allowed) {
      return ApiResponseBuilder.rateLimited(
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`
      );
    }
    
    const response = await handler(request, context);
    
    // Update rate limit counters based on response
    if (options?.skipSuccessfulRequests && response.status < 400) {
      // Don't count successful requests if configured
    } else if (options?.skipFailedRequests && response.status >= 400) {
      // Don't count failed requests if configured
    } else {
      // Count the request
      await checkRateLimit(rateLimitKey, {
        requestsPerMinute: options?.requestsPerMinute || 60,
        requestsPerHour: options?.requestsPerHour || 1000,
      }, true); // Actually increment the counter
    }
    
    return response;
  }, {
    component: options?.component,
  });
}

/**
 * Utility to create a simple validator
 */
export function createValidator(requiredFields: string[]) {
  return (body: any) => {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        errors.push(`Field '${field}' is required`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware<T = any>(
  ...middlewares: Array<(handler: ApiRouteHandler<T>) => ApiRouteHandler<T>>
) {
  return (handler: ApiRouteHandler<T>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
