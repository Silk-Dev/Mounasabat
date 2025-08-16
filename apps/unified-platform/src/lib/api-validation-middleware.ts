import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequestBody, validateQueryParams, SecurityValidator } from './input-validation';
import { CSRFProtection, RequestValidator } from './security';
import { logger } from './production-logger';
import { auditLogger, AuditEventType, AuditLogLevel } from './audit-logger';

/**
 * Configuration for API validation middleware
 */
export interface ApiValidationConfig {
  // Request validation
  maxBodySize?: number;
  allowedContentTypes?: string[];
  requireAuth?: boolean;
  
  // Security options
  enableCSRF?: boolean;
  enableXSSProtection?: boolean;
  enableSQLInjectionProtection?: boolean;
  allowedOrigins?: string[];
  
  // Sanitization options
  sanitizeInputs?: boolean;
  stripUnknownFields?: boolean;
  
  // Rate limiting
  enableRateLimit?: boolean;
  rateLimitKey?: string;
  
  // Logging
  logRequests?: boolean;
  logValidationErrors?: boolean;
  
  // Custom validation schemas
  bodySchema?: z.ZodSchema<any>;
  querySchema?: z.ZodSchema<any>;
  paramsSchema?: z.ZodSchema<any>;
}

/**
 * Default configuration for API validation
 */
const DEFAULT_CONFIG: ApiValidationConfig = {
  maxBodySize: 10 * 1024 * 1024, // 10MB
  allowedContentTypes: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'],
  requireAuth: false,
  enableCSRF: true,
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://mounasabet.com',
    'https://www.mounasabet.com'
  ],
  sanitizeInputs: true,
  stripUnknownFields: true,
  enableRateLimit: false,
  logRequests: true,
  logValidationErrors: true,
};

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: Array<{
      field: string;
      message: string;
      code: string;
    }>,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Security error class
 */
export class SecurityError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Comprehensive API validation middleware
 */
export function withApiValidation(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: ApiValidationConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log incoming request if enabled
      if (finalConfig.logRequests) {
        logger.info('API request received', {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          contentType: request.headers.get('content-type'),
        });
      }

      // 1. Basic request validation
      await validateBasicRequest(request, finalConfig, requestId);

      // 2. Security validation
      await validateSecurity(request, finalConfig, requestId);

      // 3. Content validation
      const validatedData = await validateContent(request, finalConfig, requestId);

      // 4. Attach validated data to request
      if (validatedData) {
        (request as any).validatedData = validatedData;
      }

      // 5. Call the actual handler
      const response = await handler(request, context);

      // 6. Log successful request
      if (finalConfig.logRequests) {
        const duration = Date.now() - startTime;
        logger.info('API request completed', {
          requestId,
          method: request.method,
          url: request.url,
          status: response.status,
          duration,
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log the error
      logger.error('API request failed', error, {
        requestId,
        method: request.method,
        url: request.url,
        duration,
      });

      // Audit log security violations
      if (error instanceof SecurityError) {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.SECURITY_VIOLATION,
          action: 'api_security_violation',
          description: error.message,
          success: false,
          metadata: { requestId, errorType: 'SecurityError' },
        });
      }

      // Handle different error types
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.validationErrors,
            requestId,
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof SecurityError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Security validation failed',
            message: error.message,
            requestId,
          },
          { status: error.statusCode }
        );
      }

      // Generic error handling
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred',
          requestId,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate basic request properties
 */
async function validateBasicRequest(
  request: NextRequest,
  config: ApiValidationConfig,
  requestId: string
): Promise<void> {
  // Validate request size
  if (config.maxBodySize) {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > config.maxBodySize) {
      throw new SecurityError(`Request body too large (max ${config.maxBodySize} bytes)`, 413);
    }
  }

  // Validate content type for non-GET requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && config.allowedContentTypes) {
    const contentType = request.headers.get('content-type');
    if (contentType && !config.allowedContentTypes.some(type => contentType.includes(type))) {
      throw new SecurityError(`Unsupported content type: ${contentType}`, 415);
    }
  }

  // Validate origin for state-changing requests
  if (config.allowedOrigins && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!RequestValidator.validateOrigin(request, config.allowedOrigins)) {
      throw new SecurityError('Invalid or missing origin header', 403);
    }
  }
}

/**
 * Validate security aspects of the request
 */
async function validateSecurity(
  request: NextRequest,
  config: ApiValidationConfig,
  requestId: string
): Promise<void> {
  // CSRF Protection
  if (config.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const isValidCSRF = await CSRFProtection.validateRequest(request);
    if (!isValidCSRF) {
      throw new SecurityError('CSRF token validation failed', 403);
    }
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && !SecurityValidator.validateInput(value, 'general')) {
      throw new SecurityError(`Suspicious header detected: ${header}`, 403);
    }
  }

  // Validate User-Agent
  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    // Check for common bot patterns that might be malicious
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /owasp/i,
      /<script/i,
      /javascript:/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      throw new SecurityError('Suspicious user agent detected', 403);
    }
  }
}

/**
 * Validate and sanitize request content
 */
async function validateContent(
  request: NextRequest,
  config: ApiValidationConfig,
  requestId: string
): Promise<any> {
  const validatedData: any = {};

  try {
    // Validate query parameters
    if (config.querySchema) {
      const { searchParams } = new URL(request.url);
      validatedData.query = validateQueryParams(searchParams, config.querySchema);
    } else if (config.sanitizeInputs) {
      // Basic sanitization of query parameters
      const { searchParams } = new URL(request.url);
      const sanitizedQuery: any = {};
      
      for (const [key, value] of searchParams.entries()) {
        const sanitizedKey = SecurityValidator.sanitizeInput(key, 'general');
        const sanitizedValue = SecurityValidator.sanitizeInput(value, 'general');
        
        // Additional validation for common injection patterns
        if (config.enableXSSProtection && !SecurityValidator.validateInput(sanitizedValue, 'html')) {
          throw new SecurityError(`XSS attempt detected in query parameter: ${key}`, 403);
        }
        
        if (config.enableSQLInjectionProtection && !SecurityValidator.validateInput(sanitizedValue, 'sql')) {
          throw new SecurityError(`SQL injection attempt detected in query parameter: ${key}`, 403);
        }
        
        sanitizedQuery[sanitizedKey] = sanitizedValue;
      }
      
      validatedData.query = sanitizedQuery;
    }

    // Validate request body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.json();
        
        if (config.bodySchema) {
          validatedData.body = validateRequestBody(body, config.bodySchema, {
            stripUnknown: config.stripUnknownFields,
            maxSize: config.maxBodySize,
            sanitize: config.sanitizeInputs,
          });
        } else if (config.sanitizeInputs) {
          // Basic sanitization and security checks
          validatedData.body = sanitizeAndValidateObject(body, config);
        } else {
          validatedData.body = body;
        }
      } else if (contentType?.includes('multipart/form-data')) {
        // Handle file uploads with validation
        const formData = await request.formData();
        validatedData.formData = await validateFormData(formData, config);
      }
    }

    return validatedData;

  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new ValidationError('Request validation failed', formattedErrors);
    }
    
    throw error;
  }
}

/**
 * Sanitize and validate object recursively
 */
function sanitizeAndValidateObject(obj: any, config: ApiValidationConfig): any {
  if (typeof obj === 'string') {
    const sanitized = SecurityValidator.sanitizeInput(obj, 'general');
    
    // Additional security checks
    if (config.enableXSSProtection && !SecurityValidator.validateInput(sanitized, 'html')) {
      throw new SecurityError('XSS attempt detected in request body', 403);
    }
    
    if (config.enableSQLInjectionProtection && !SecurityValidator.validateInput(sanitized, 'sql')) {
      throw new SecurityError('SQL injection attempt detected in request body', 403);
    }
    
    return sanitized;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeAndValidateObject(item, config));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key
      const sanitizedKey = SecurityValidator.sanitizeInput(key, 'general');
      
      // Validate key for suspicious patterns
      if (sanitizedKey.length > 100) {
        throw new SecurityError('Property name too long', 400);
      }
      
      if (!/^[a-zA-Z0-9_.-]+$/.test(sanitizedKey)) {
        throw new SecurityError(`Invalid property name: ${sanitizedKey}`, 400);
      }
      
      sanitized[sanitizedKey] = sanitizeAndValidateObject(value, config);
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate form data including file uploads
 */
async function validateFormData(formData: FormData, config: ApiValidationConfig): Promise<any> {
  const validated: any = {};
  
  for (const [key, value] of formData.entries()) {
    const sanitizedKey = SecurityValidator.sanitizeInput(key, 'general');
    
    if (value instanceof File) {
      // Validate file upload
      if (value.size > (config.maxBodySize || 10 * 1024 * 1024)) {
        throw new ValidationError('File too large', [
          { field: sanitizedKey, message: 'File exceeds maximum size limit', code: 'file_too_large' }
        ]);
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(value.type)) {
        throw new ValidationError('Invalid file type', [
          { field: sanitizedKey, message: `File type ${value.type} not allowed`, code: 'invalid_file_type' }
        ]);
      }
      
      validated[sanitizedKey] = value;
    } else {
      // Sanitize text values
      const sanitizedValue = SecurityValidator.sanitizeInput(value.toString(), 'general');
      validated[sanitizedKey] = sanitizedValue;
    }
  }
  
  return validated;
}

/**
 * Create validation schemas for common API patterns
 */
export const ApiValidationSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
    offset: z.string().transform(val => Math.max(0, parseInt(val) || 0)).optional(),
  }),

  // Sorting parameters
  sorting: z.object({
    sortBy: z.string().max(50).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Common ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Search parameters
  search: z.object({
    q: z.string().max(200).optional(),
    category: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'all']).default('active'),
  }),

  // Date range parameters
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'Start date must be before end date',
  }),
};

export default withApiValidation;