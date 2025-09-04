import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hash as sha256 } from '@/lib/security/hash';

export class TokenSecurity {
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a secure random token
   */
  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Generate a secure token pair (token + secret)
   */
  static generateTokenPair(): { token: string; secret: string } {
    return {
      token: this.generateToken(),
      secret: this.generateToken()
    };
  }

  /**
   * Hash a token for storage
   */
  static async hashToken(token: string, secret: string): Promise<string> {
    return sha256(`${token}:${secret}`);
  }

  /**
   * Verify a token pair against a stored hash
   */
  static async verifyToken(token: string, secret: string, storedHash: string): Promise<boolean> {
    if (!token || !secret || !storedHash) {
      return false;
    }

    const computedHash = await this.hashToken(token, secret);
    return computedHash === storedHash;
  }
}

export class SecurityHeaders {
  static readonly DEFAULT_HEADERS = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://maps.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
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
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };

  /**
   * Apply security headers to a response
   */
  static applyHeaders(response: NextResponse): NextResponse {
    Object.entries(this.DEFAULT_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

export class RequestSecurity {
  /**
   * Validate request origin against allowed origins
   */
  static validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return false;
    return allowedOrigins.includes(origin);
  }

  /**
   * Validate request content type
   */
  static validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;
    return allowedTypes.some(type => contentType.includes(type));
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  /**
   * Sanitize a file path
   */
  static sanitizeFilePath(path: string): string {
    if (!path) return '';
    return path
      .replace(/\.\./g, '') // Prevent directory traversal
      .replace(/[<>:"|?*]/g, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .substring(0, 255);
  }
}
