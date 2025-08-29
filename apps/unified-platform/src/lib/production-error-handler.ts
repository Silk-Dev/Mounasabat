import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';
import { ApiResponseBuilder, type ErrorResponse } from './api-response';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface SanitizedError {
  message: string;
  code?: string;
  type: string;
  statusCode: number;
  timestamp: string;
  requestId: string;
}

export class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'ssn',
    'social_security',
    'bank_account',
    'routing_number',
    'api_key',
    'private_key',
    'access_token',
    'refresh_token',
  ];

  private constructor() {}

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  /**
   * Generate a unique error ID for tracking
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize error data to prevent sensitive information exposure
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive information
      const isSensitive = this.sensitiveFields.some(field => 
        lowerKey.includes(field)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Extract error context from request
   */
  private extractRequestContext(request: NextRequest): ErrorContext {
    const url = new URL(request.url);
    
    return {
      requestId: this.generateErrorId(),
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      headers: this.sanitizeData(Object.fromEntries(request.headers.entries())),
      query: this.sanitizeData(Object.fromEntries(url.searchParams.entries())),
    };
  }

  /**
   * Determine appropriate HTTP status code from error
   */
  private getStatusCode(error: Error): number {
    const message = error.message.toLowerCase();
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 401;
    }
    
    if (message.includes('forbidden') || message.includes('access denied')) {
      return 403;
    }
    
    if (message.includes('not found')) {
      return 404;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 400;
    }
    
    if (message.includes('conflict') || message.includes('already exists')) {
      return 409;
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 429;
    }
    
    // Default to 500 for unknown errors
    return 500;
  }

  /**
   * Sanitize error message for public consumption
   */
  private sanitizeErrorMessage(error: Error, statusCode: number): string {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production') {
      switch (statusCode) {
        case 400:
          return 'Invalid request data';
        case 401:
          return 'Authentication required';
        case 403:
          return 'Access denied';
        case 404:
          return 'Resource not found';
        case 409:
          return 'Resource conflict';
        case 429:
          return 'Too many requests';
        case 500:
        default:
          return 'Internal server error';
      }
    }
    
    // In development, show the actual error message
    return error.message;
  }

  /**
   * Log error to Sentry with proper context and sanitization
   */
  private logToSentry(error: Error, context: ErrorContext, statusCode: number): void {
    // Set Sentry context
    Sentry.setContext('error_handler', {
      requestId: context.requestId,
      statusCode,
      component: context.component,
      action: context.action,
      url: context.url,
      method: context.method,
    });

    // Set user context if available
    if (context.userId) {
      Sentry.setUser({ id: context.userId });
    }

    // Set tags for better filtering
    Sentry.setTags({
      error_type: error.constructor.name,
      status_code: statusCode.toString(),
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      request_id: context.requestId || 'unknown',
    });

    // Add sanitized extra data
    Sentry.setExtra('context', this.sanitizeData(context));
    Sentry.setExtra('error_details', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Capture the exception
    Sentry.captureException(error, {
      level: statusCode >= 500 ? 'error' : 'warning',
      fingerprint: [
        error.constructor.name,
        context.component || 'unknown',
        context.action || 'unknown',
      ],
    });
  }

  /**
   * Handle API route errors
   */
  handleAPIError(
    error: Error,
    request: NextRequest,
    additionalContext?: Partial<ErrorContext>
  ): NextResponse<ErrorResponse> {
    const context = {
      ...this.extractRequestContext(request),
      ...additionalContext,
    };

    const statusCode = this.getStatusCode(error);
    const sanitizedMessage = this.sanitizeErrorMessage(error, statusCode);

    // Log the error
    logger.apiError(
      request.method,
      request.url,
      statusCode,
      error,
      context
    );

    // Log to Sentry
    this.logToSentry(error, context, statusCode);

    // Return sanitized error response
    return ApiResponseBuilder.error(
      sanitizedMessage,
      statusCode,
      undefined,
      this.getErrorCode(error, statusCode),
      process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        originalMessage: error.message,
      } : undefined
    );
  }

  /**
   * Handle client-side errors
   */
  handleClientError(
    error: Error,
    context?: Partial<ErrorContext>
  ): SanitizedError {
    const errorId = this.generateErrorId();
    const statusCode = this.getStatusCode(error);
    
    const fullContext: ErrorContext = {
      requestId: errorId,
      component: 'client',
      ...context,
    };

    // Log the error
    logger.componentError(
      context?.component || 'client',
      error,
      fullContext
    );

    // Log to Sentry
    this.logToSentry(error, fullContext, statusCode);

    // Return sanitized error for client consumption
    return {
      message: this.sanitizeErrorMessage(error, statusCode),
      code: this.getErrorCode(error, statusCode),
      type: error.constructor.name,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: errorId,
    };
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(
    error: Error,
    query?: string,
    context?: Partial<ErrorContext>
  ): SanitizedError {
    const errorId = this.generateErrorId();
    
    const fullContext: ErrorContext = {
      requestId: errorId,
      component: 'database',
      metadata: { query },
      ...context,
    };

    // Log the error
    logger.error(
      `Database error: ${error.message}`,
      error,
      fullContext
    );

    // Log to Sentry
    this.logToSentry(error, fullContext, 500);

    // Return generic database error message
    return {
      message: process.env.NODE_ENV === 'production' 
        ? 'Database operation failed' 
        : error.message,
      code: 'DATABASE_ERROR',
      type: error.constructor.name,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId: errorId,
    };
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    error: Error,
    validationDetails?: any,
    context?: Partial<ErrorContext>
  ): NextResponse<ErrorResponse> {
    const errorId = this.generateErrorId();
    
    const fullContext: ErrorContext = {
      requestId: errorId,
      component: 'validation',
      metadata: { validationDetails: this.sanitizeData(validationDetails) },
      ...context,
    };

    // Log the error
    logger.warn(
      `Validation error: ${error.message}`,
      fullContext,
      error
    );

    // Don't log validation errors to Sentry unless they're unexpected
    if (!error.message.includes('validation') && !error.message.includes('invalid')) {
      this.logToSentry(error, fullContext, 400);
    }

    return ApiResponseBuilder.validationError(
      this.sanitizeData(validationDetails),
      error.message
    );
  }

  /**
   * Get error code based on error type and status
   */
  private getErrorCode(error: Error, statusCode: number): string {
    const errorName = error.constructor.name.toUpperCase();
    
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      case 500:
      default:
        return errorName.includes('ERROR') ? errorName : `${errorName}_ERROR`;
    }
  }

  /**
   * Create a middleware wrapper for API routes
   */
  wrapAPIRoute<T = any>(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse<T | ErrorResponse>> => {
      try {
        return await handler(request, context);
      } catch (error) {
        return this.handleAPIError(
          error instanceof Error ? error : new Error(String(error)),
          request,
          { component: 'api_route' }
        );
      }
    };
  }

  /**
   * Create error boundary handler
   */
  createErrorBoundaryHandler(component: string) {
    return (error: Error, errorInfo: any) => {
      this.handleClientError(error, {
        component,
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      });
    };
  }
}

// Export singleton instance
export const errorHandler = ProductionErrorHandler.getInstance();

// Convenience functions
export const handleAPIError = (error: Error, request: NextRequest, context?: Partial<ErrorContext>) =>
  errorHandler.handleAPIError(error, request, context);

export const handleClientError = (error: Error, context?: Partial<ErrorContext>) =>
  errorHandler.handleClientError(error, context);

export const handleDatabaseError = (error: Error, query?: string, context?: Partial<ErrorContext>) =>
  errorHandler.handleDatabaseError(error, query, context);

export const handleValidationError = (error: Error, details?: any, context?: Partial<ErrorContext>) =>
  errorHandler.handleValidationError(error, details, context);

export const wrapAPIRoute = <T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) => errorHandler.wrapAPIRoute(handler);
