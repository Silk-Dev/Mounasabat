import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Enhanced input validation and sanitization utilities
 */

// Common validation patterns
export const ValidationPatterns = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  SAFE_TEXT: /^[a-zA-Z0-9\s\-_.,!?()\n\r]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  POSTAL_CODE: /^[A-Z0-9\s\-]{3,10}$/i,
  TIME_24H: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
};

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string, options?: {
  allowHtml?: boolean;
  maxLength?: number;
  pattern?: RegExp;
}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove HTML if not allowed
  if (!options?.allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
  } else {
    // Allow only safe HTML tags
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    });
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limit
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Validate against pattern
  if (options?.pattern && !options.pattern.test(sanitized)) {
    throw new Error(`Input does not match required pattern: ${options.pattern}`);
  }

  return sanitized;
}

/**
 * Create a sanitized string schema with validation
 */
export function createSafeStringSchema(
  minLength: number = 1,
  maxLength: number = 100,
  pattern?: RegExp,
  allowHtml: boolean = false
) {
  return z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`)
    .transform(str => sanitizeString(str, { allowHtml, maxLength, pattern }))
    .refine(str => !pattern || pattern.test(str), {
      message: 'Contains invalid characters',
    });
}

/**
 * Create a sanitized text schema for longer content
 */
export function createSafeTextSchema(
  minLength: number = 1,
  maxLength: number = 1000,
  allowHtml: boolean = false
) {
  return z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`)
    .transform(str => sanitizeString(str, { 
      allowHtml, 
      maxLength, 
      pattern: allowHtml ? undefined : ValidationPatterns.SAFE_TEXT 
    }));
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // Basic types
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format').max(255).toLowerCase(),
  phone: z.string().regex(ValidationPatterns.PHONE, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format').max(2048),
  
  // Identifiers
  slug: z.string().regex(ValidationPatterns.SLUG, 'Invalid slug format').max(100),
  alphanumeric: z.string().regex(ValidationPatterns.ALPHANUMERIC, 'Must contain only letters and numbers').max(50),
  
  // Strings
  safeString: (min = 1, max = 100) => createSafeStringSchema(min, max, ValidationPatterns.SAFE_STRING),
  safeText: (min = 1, max = 1000) => createSafeTextSchema(min, max),
  
  // Numbers
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  price: z.number().min(0, 'Price cannot be negative').max(1000000, 'Price exceeds maximum'),
  
  // Dates
  futureDate: z.date().min(new Date(), 'Date must be in the future'),
  pastDate: z.date().max(new Date(), 'Date must be in the past'),
  dateString: z.string().regex(ValidationPatterns.DATE_ISO, 'Invalid date format'),
  
  // Arrays
  stringArray: (maxItems = 10) => z.array(z.string().trim()).max(maxItems, `Too many items (max ${maxItems})`),
  uuidArray: (maxItems = 10) => z.array(z.string().uuid()).max(maxItems, `Too many items (max ${maxItems})`),
  
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  }),
  
  // Sorting
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Status enums
  activeStatus: z.enum(['active', 'inactive', 'all']).default('active'),
  booleanString: z.enum(['true', 'false']).transform(val => val === 'true'),
};

/**
 * Validate and sanitize request body
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  options?: {
    stripUnknown?: boolean;
    maxSize?: number;
    sanitize?: boolean;
  }
): T {
  // Check body size if specified
  if (options?.maxSize) {
    const bodySize = JSON.stringify(body).length;
    if (bodySize > options.maxSize) {
      throw new Error(`Request body too large (${bodySize} bytes, max ${options.maxSize})`);
    }
  }

  // Pre-sanitize the body if requested
  if (options?.sanitize && typeof body === 'object' && body !== null) {
    body = sanitizeObjectRecursively(body);
  }

  try {
    // Parse and validate with Zod
    const result = schema.parse(body);
    
    // Strip unknown properties if requested
    if (options?.stripUnknown) {
      return JSON.parse(JSON.stringify(result));
    }
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      const validationError = new Error('Validation failed');
      (validationError as any).validationErrors = formattedErrors;
      throw validationError;
    }
    
    throw error;
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObjectRecursively(obj: any): any {
  if (typeof obj === 'string') {
    return SecurityValidator.sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectRecursively(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key as well
      const sanitizedKey = typeof key === 'string' ? SecurityValidator.sanitizeInput(key) : key;
      sanitized[sanitizedKey] = sanitizeObjectRecursively(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate and sanitize query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries());
  return validateRequestBody(params, schema);
}

/**
 * Create a comprehensive validation schema for common API patterns
 */
export function createApiValidationSchema<T extends z.ZodRawShape>(
  shape: T,
  options?: {
    requireAuth?: boolean;
    maxBodySize?: number;
    allowUnknown?: boolean;
  }
) {
  const baseSchema = z.object(shape);
  
  if (options?.allowUnknown) {
    return baseSchema.passthrough();
  }
  
  return baseSchema.strict();
}

/**
 * Security-focused input validation
 */
export class SecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /<form/gi,
    /<input/gi,
    /<textarea/gi,
    /<select/gi,
    /<button/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|TRUNCATE|GRANT|REVOKE)\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b|\bAND\b).*?[=<>]/gi,
    /\b(WAITFOR|DELAY)\b/gi,
    /\b(CAST|CONVERT|CHAR|ASCII)\b/gi,
    /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b/gi,
    /\b(xp_|sp_)\w+/gi,
    /\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/gi,
  ];

  private static readonly LDAP_INJECTION_PATTERNS = [
    /[()&|!]/g,
    /\*(?![a-zA-Z0-9])/g,
    /\\[^\\]/g,
  ];

  private static readonly COMMAND_INJECTION_PATTERNS = [
    /[;&|`$(){}[\]]/g,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|nslookup|dig|curl|wget)\b/gi,
    /\.\.\//g,
    /~\//g,
  ];

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
  ];

  static validateInput(input: string, type: 'html' | 'sql' | 'ldap' | 'command' | 'path' | 'general' = 'general'): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    let patterns: RegExp[] = [];

    switch (type) {
      case 'html':
        patterns = this.DANGEROUS_PATTERNS;
        break;
      case 'sql':
        patterns = this.SQL_INJECTION_PATTERNS;
        break;
      case 'ldap':
        patterns = this.LDAP_INJECTION_PATTERNS;
        break;
      case 'command':
        patterns = this.COMMAND_INJECTION_PATTERNS;
        break;
      case 'path':
        patterns = this.PATH_TRAVERSAL_PATTERNS;
        break;
      case 'general':
      default:
        patterns = [
          ...this.DANGEROUS_PATTERNS,
          ...this.SQL_INJECTION_PATTERNS,
          ...this.COMMAND_INJECTION_PATTERNS,
          ...this.PATH_TRAVERSAL_PATTERNS,
        ];
        break;
    }

    return !patterns.some(pattern => pattern.test(input));
  }

  static sanitizeInput(input: string, type: 'html' | 'sql' | 'ldap' | 'command' | 'path' | 'general' = 'general'): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Apply type-specific sanitization
    switch (type) {
      case 'html':
        sanitized = this.sanitizeHtml(sanitized);
        break;
      case 'sql':
        sanitized = this.sanitizeSql(sanitized);
        break;
      case 'ldap':
        sanitized = this.sanitizeLdap(sanitized);
        break;
      case 'command':
        sanitized = this.sanitizeCommand(sanitized);
        break;
      case 'path':
        sanitized = this.sanitizePath(sanitized);
        break;
      case 'general':
      default:
        sanitized = this.sanitizeGeneral(sanitized);
        break;
    }

    return sanitized;
  }

  private static sanitizeHtml(input: string): string {
    let sanitized = input;
    
    // Remove dangerous HTML patterns
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Encode remaining HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }

  private static sanitizeSql(input: string): string {
    let sanitized = input;

    // Remove SQL injection patterns
    this.SQL_INJECTION_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Escape remaining SQL special characters
    sanitized = sanitized
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\\/g, '\\\\')
      .replace(/\x00/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');

    return sanitized;
  }

  private static sanitizeLdap(input: string): string {
    return input
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\*/g, '\\2A')
      .replace(/\\/g, '\\5C')
      .replace(/\x00/g, '\\00')
      .replace(/&/g, '\\26')
      .replace(/!/g, '\\21')
      .replace(/\|/g, '\\7C');
  }

  private static sanitizeCommand(input: string): string {
    return input
      .replace(/[;&|`$(){}[\]]/g, '')
      .replace(/\.\.\//g, '')
      .replace(/~\//g, '')
      .replace(/\x00/g, '');
  }

  private static sanitizePath(input: string): string {
    return input
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/%2e%2e%2f/gi, '')
      .replace(/%2e%2e%5c/gi, '')
      .replace(/\.\.%2f/gi, '')
      .replace(/\.\.%5c/gi, '')
      .replace(/\x00/g, '');
  }

  private static sanitizeGeneral(input: string): string {
    let sanitized = input;

    // Apply all sanitization methods
    sanitized = this.sanitizeHtml(sanitized);
    sanitized = this.sanitizeSql(sanitized);
    sanitized = this.sanitizeCommand(sanitized);
    sanitized = this.sanitizePath(sanitized);

    // Additional general sanitization
    sanitized = sanitized
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return sanitized;
  }

  /**
   * Validate email address with additional security checks
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /\.\./g,
      /[<>]/g,
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }

  /**
   * Validate URL with security checks
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/gi,
        /data:/gi,
        /vbscript:/gi,
        /file:/gi,
        /ftp:/gi,
      ];

      return !suspiciousPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Check if it contains only digits (and optionally starts with +)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Validate UUID format
   */
  static validateUuid(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate JSON string
   */
  static validateJson(jsonString: string): boolean {
    if (!jsonString || typeof jsonString !== 'string') {
      return false;
    }

    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if string contains only safe characters
   */
  static isSafeString(input: string, allowedChars?: RegExp): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const defaultAllowed = /^[a-zA-Z0-9\s\-_.,!?()]+$/;
    const pattern = allowedChars || defaultAllowed;
    
    return pattern.test(input) && this.validateInput(input, 'general');
  }
}

/**
 * File upload validation
 */
export class FileValidator {
  private static readonly ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'text/plain', 'application/msword'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg'],
  };

  private static readonly MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 10 * 1024 * 1024, // 10MB
  };

  static validateFile(
    file: File,
    type: keyof typeof FileValidator.ALLOWED_MIME_TYPES,
    options?: {
      maxSize?: number;
      allowedTypes?: string[];
    }
  ): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || this.MAX_FILE_SIZES[type];
    const allowedTypes = options?.allowedTypes || this.ALLOWED_MIME_TYPES[type];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

export default {
  ValidationPatterns,
  sanitizeString,
  createSafeStringSchema,
  createSafeTextSchema,
  CommonSchemas,
  validateRequestBody,
  validateQueryParams,
  createApiValidationSchema,
  SecurityValidator,
  FileValidator,
};