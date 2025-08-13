import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
  meta?: ResponseMetadata;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ResponseMetadata {
  timestamp: number;
  requestId?: string;
  version?: string;
  [key: string]: any;
}

export class ApiResponseBuilder {
  /**
   * Create a successful API response
   */
  static success<T>(
    data: T,
    message?: string,
    pagination?: PaginationInfo,
    meta?: ResponseMetadata
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      pagination,
      meta: {
        timestamp: Date.now(),
        ...meta,
      },
    };

    return NextResponse.json(response);
  }

  /**
   * Create an error API response
   */
  static error(
    error: string,
    status: number = 500,
    message?: string,
    code?: string,
    details?: any
  ): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error,
      message,
      code,
      details,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a validation error response
   */
  static validationError(
    details: any,
    message: string = 'Validation failed'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Validation Error',
      400,
      message,
      'VALIDATION_ERROR',
      details
    );
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(
    message: string = 'Authentication required'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Unauthorized',
      401,
      message,
      'UNAUTHORIZED'
    );
  }

  /**
   * Create a forbidden response
   */
  static forbidden(
    message: string = 'Access denied'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Forbidden',
      403,
      message,
      'FORBIDDEN'
    );
  }

  /**
   * Create a not found response
   */
  static notFound(
    resource: string = 'Resource'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Not Found',
      404,
      `${resource} not found`,
      'NOT_FOUND'
    );
  }

  /**
   * Create a rate limit response
   */
  static rateLimited(
    message: string = 'Too many requests'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Rate Limited',
      429,
      message,
      'RATE_LIMITED'
    );
  }

  /**
   * Create an internal server error response
   */
  static internalError(
    message: string = 'Internal server error'
  ): NextResponse<ErrorResponse> {
    return this.error(
      'Internal Server Error',
      500,
      message,
      'INTERNAL_ERROR'
    );
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };

    return this.success(data, message, pagination);
  }

  /**
   * Create an empty response (no data found)
   */
  static empty<T>(
    message: string = 'No data found'
  ): NextResponse<ApiResponse<T[]>> {
    return this.success([] as T[], message);
  }
}

/**
 * Utility function to handle common API patterns
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiResponse<T> | ErrorResponse>> {
  return handler()
    .then(data => ApiResponseBuilder.success(data))
    .catch(error => {
      console.error('API Error:', error);
      
      if (error.message?.includes('not found')) {
        return ApiResponseBuilder.notFound();
      }
      
      if (error.message?.includes('unauthorized') || error.message?.includes('authentication')) {
        return ApiResponseBuilder.unauthorized();
      }
      
      if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        return ApiResponseBuilder.validationError(error.details || {}, error.message);
      }
      
      return ApiResponseBuilder.internalError(
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    });
}

/**
 * Utility to validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  return missing;
}

/**
 * Utility to sanitize pagination parameters
 */
export function sanitizePagination(
  page?: string | null,
  limit?: string | null
): { page: number; limit: number } {
  const sanitizedPage = Math.max(1, parseInt(page || '1') || 1);
  const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit || '10') || 10));
  
  return {
    page: sanitizedPage,
    limit: sanitizedLimit,
  };
}