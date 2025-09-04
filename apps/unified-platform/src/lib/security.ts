import { NextRequest, NextResponse } from 'next/server';
import { hash, compare, genSalt } from 'bcryptjs';

// CSRF Token Management
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';
  private static readonly SECRET_HEADER = 'x-csrf-secret';

  static async generateToken(): Promise<{ token: string; secret: string }> {
    const generateRandomHex = async (length: number): Promise<string> => {
      const buffer = new Uint8Array(length);
      crypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };
    
    const secret = await generateRandomHex(this.TOKEN_LENGTH);
    const token = await generateRandomHex(this.TOKEN_LENGTH);
    
    return { token, secret };
  }

  static async generateTokenHash(token: string, secret: string): Promise<string> {
    return await hash(`${token}:${secret}`, 10);
  }

  static async validateToken(
    providedToken: string,
    providedSecret: string,
    storedHash: string
  ): Promise<boolean> {
    if (!providedToken || !providedSecret || !storedHash) {
      return false;
    }

    try {
      const expectedHash = await this.generateTokenHash(providedToken, providedSecret);
      // Instead of byte-by-byte comparison, we'll use bcryptjs's compare function
      // which is already timing-safe
      return await compare(expectedHash, storedHash);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  static async validateRequest(req: NextRequest): Promise<boolean> {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return true;
    }

    const token = req.headers.get(this.TOKEN_HEADER);
    const secret = req.headers.get(this.SECRET_HEADER);
    const cookieToken = req.cookies.get(this.TOKEN_COOKIE)?.value;

    if (!token || !secret || !cookieToken) {
      return false;
    }

    // Validate that the token matches the cookie
    if (token !== cookieToken) {
      return false;
    }

    // For now, we'll implement a simple validation
    // In production, you'd want to store the secret securely
    return token.length === this.TOKEN_LENGTH * 2 && secret.length === this.TOKEN_LENGTH * 2;
  }
}

// Security Headers Configuration
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Frame-Options
  'X-Frame-Options': 'DENY',

  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',

  // X-XSS-Protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),

  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Input Sanitization Utilities
export class InputSanitizer {
  // Remove potentially dangerous HTML tags and attributes
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Sanitize SQL injection attempts
  static sanitizeSql(input: string): string {
    return input
      .replace(/['";\\]/g, '')
      .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  // Sanitize file paths
  static sanitizeFilePath(input: string): string {
    return input
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .substring(0, 255);
  }

  // General purpose sanitizer
  static sanitizeGeneral(input: string): string {
    return this.sanitizeHtml(this.sanitizeSql(input)).trim();
  }
}

// Password Security Utilities
export class PasswordSecurity {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 100;

  static validateStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    if (password.length > this.MAX_LENGTH) {
      feedback.push(`Password must be no more than ${this.MAX_LENGTH} characters long`);
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[@$!%*?&]/.test(password)) {
      feedback.push('Password must contain at least one special character (@$!%*?&)');
    } else {
      score += 1;
    }

    // Common patterns check
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password should not contain repeated characters');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      feedback.push('Password should not contain common patterns');
      score -= 2;
    }

    const isValid = feedback.length === 0 && score >= 4;

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }
}

// Request validation utilities
export class RequestValidator {
  // Validate request origin
  static validateOrigin(req: NextRequest, allowedOrigins: string[]): boolean {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    if (!origin && !referer) {
      return false; // Require origin or referer for state-changing requests
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : '');
    return allowedOrigins.includes(requestOrigin);
  }

  // Validate content type
  static validateContentType(req: NextRequest, allowedTypes: string[]): boolean {
    const contentType = req.headers.get('content-type');
    if (!contentType) return false;

    return allowedTypes.some(type => contentType.includes(type));
  }

  // Validate request size
  static async validateRequestSize(req: NextRequest, maxSize: number): Promise<boolean> {
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10) <= maxSize;
    }

    // If no content-length header, we'll need to read the body
    try {
      const body = await req.text();
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(body).length;
      return byteLength <= maxSize;
    } catch {
      return false;
    }
  }
}

// Security middleware factory
export function createSecurityMiddleware(options: {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  allowedOrigins?: string[];
  maxRequestSize?: number;
} = {}) {
  return async (req: NextRequest) => {
    const response = NextResponse.next();

    // Apply security headers
    applySecurityHeaders(response);

    // CSRF Protection
    if (options.enableCSRF && !await CSRFProtection.validateRequest(req)) {
      return new NextResponse('CSRF token validation failed', { status: 403 });
    }

    // Origin validation for state-changing requests
    if (options.allowedOrigins && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      if (!RequestValidator.validateOrigin(req, options.allowedOrigins)) {
        return new NextResponse('Invalid origin', { status: 403 });
      }
    }

    // Request size validation
    if (options.maxRequestSize) {
      if (!await RequestValidator.validateRequestSize(req, options.maxRequestSize)) {
        return new NextResponse('Request too large', { status: 413 });
      }
    }

    return response;
  };
}
