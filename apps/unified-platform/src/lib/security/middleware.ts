import { NextRequest, NextResponse } from 'next/server';
import { SecurityHeaders, RequestSecurity, TokenSecurity } from './index';

interface SecurityMiddlewareOptions {
  enableCSRF?: boolean;
  enableHeaders?: boolean;
  allowedOrigins?: string[];
  allowedContentTypes?: string[];
  maxRequestSize?: number;
}

/**
 * Create a security middleware with the specified options
 */
export function createSecurityMiddleware(options: SecurityMiddlewareOptions = {}) {
  const {
    enableCSRF = true,
    enableHeaders = true,
    allowedOrigins = [],
    allowedContentTypes = ['application/json', 'multipart/form-data'],
    maxRequestSize = 10 * 1024 * 1024 // 10MB default
  } = options;

  return async function securityMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    // Initial response
    const response = NextResponse.next();

    // 1. Apply security headers
    if (enableHeaders) {
      SecurityHeaders.applyHeaders(response);
    }

    // 2. Skip further checks for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return response;
    }

    // 3. Origin validation for state-changing requests
    if (allowedOrigins.length > 0) {
      if (!RequestSecurity.validateOrigin(request, allowedOrigins)) {
        return new NextResponse('Invalid origin', { status: 403 });
      }
    }

    // 4. Content-Type validation
    if (!RequestSecurity.validateContentType(request, allowedContentTypes)) {
      return new NextResponse('Invalid content type', { status: 415 });
    }

    // 5. CSRF protection for state-changing requests
    if (enableCSRF) {
      const token = request.headers.get('x-csrf-token');
      const secret = request.headers.get('x-csrf-secret');
      const storedToken = request.cookies.get('csrf-token')?.value;

      if (!token || !secret || !storedToken) {
        return new NextResponse('CSRF token required', { status: 403 });
      }

      const isValidToken = await TokenSecurity.verifyToken(token, secret, storedToken);
      if (!isValidToken) {
        return new NextResponse('Invalid CSRF token', { status: 403 });
      }
    }

    // 6. Request size validation
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > maxRequestSize) {
      return new NextResponse('Request too large', { status: 413 });
    }

    return response;
  };
}
