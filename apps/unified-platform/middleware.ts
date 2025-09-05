import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimiter } from '@/lib/rate-limiter';
import { applySecurityHeaders, CSRFProtection, RequestValidator } from '@/lib/security';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': 'admin',
  '/provider': 'provider',
  '/customer/account': 'customer',
  '/customer/bookings': 'customer',
  '/customer/favorites': 'customer',
} as const;

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth',
];

// Routes that should redirect authenticated users away
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Allow static files to pass through without security checks
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') && !pathname.startsWith('/api/')
  ) {
    return response;
  }

  // Security validations for API routes
  if (pathname.startsWith('/api/')) {
    try {
      // Rate limiting for API routes
      const rateLimitResult = await rateLimiter.createMiddleware('api')(request);
      
      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        await auditLogger.logSecurityEvent(
          AuditEventType.RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded for ${pathname}`,
          request
        );
        
        return new NextResponse('Rate limit exceeded', { 
          status: 429,
          headers: rateLimitResult.headers,
        });
      }

      // Add rate limit headers to response
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // CSRF protection for state-changing requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        // Validate origin
        const allowedOrigins = [
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        ].filter(Boolean);

        if (!RequestValidator.validateOrigin(request, allowedOrigins)) {
          await auditLogger.logSecurityEvent(
            AuditEventType.SECURITY_VIOLATION,
            `Invalid origin for ${pathname}`,
            request
          );
          
          return new NextResponse('Invalid origin', { status: 403 });
        }

        // Validate content type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const allowedContentTypes = [
            'application/json',
            'application/x-www-form-urlencoded',
            'multipart/form-data',
          ];
          
          if (!RequestValidator.validateContentType(request, allowedContentTypes)) {
            await auditLogger.logSecurityEvent(
              AuditEventType.SECURITY_VIOLATION,
              `Invalid content type for ${pathname}`,
              request
            );
            
            return new NextResponse('Invalid content type', { status: 400 });
          }
        }

        // Request size validation (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (!await RequestValidator.validateRequestSize(request, maxSize)) {
          await auditLogger.logSecurityEvent(
            AuditEventType.SECURITY_VIOLATION,
            `Request too large for ${pathname}`,
            request
          );
          
          return new NextResponse('Request too large', { status: 413 });
        }
      }
    } catch (error) {
      console.error('Security middleware error:', error);
      await auditLogger.logSecurityEvent(
        AuditEventType.SECURITY_VIOLATION,
        `Security middleware error for ${pathname}: ${error}`,
        request
      );
      
      // Allow request to continue on security middleware errors
      // but log the incident
    }
    
    return response;
  }

  try {
    // Rate limiting for non-API routes
    if (!pathname.startsWith('/api/')) {
      const rateLimitResult = await rateLimiter.createMiddleware('search')(request);
      
      if (!rateLimitResult.allowed) {
        await auditLogger.logSecurityEvent(
          AuditEventType.RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded for ${pathname}`,
          request
        );
        
        return new NextResponse('Rate limit exceeded', { 
          status: 429,
          headers: rateLimitResult.headers,
        });
      }

      // Add rate limit headers to response
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    // Get session from the request
    const cookieHeader = request.headers.get('cookie');
    const session = cookieHeader ? await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader,
      }),
    }) : null;

    // Handle auth routes (signin, signup) - redirect if already authenticated
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (session) {
        // Redirect based on user role (default to customer for now)
        const role = (session.user as any).role || 'customer';
        const redirectUrl = getRoleBasedRedirect(role);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      return NextResponse.next();
    }

    // Check if route requires authentication
    const protectedRoute = Object.keys(protectedRoutes).find(route => 
      pathname.startsWith(route)
    );

    if (protectedRoute) {
      // Route requires authentication
      if (!session) {
        // Log unauthorized access attempt
        await auditLogger.logSecurityEvent(
          AuditEventType.UNAUTHORIZED_ACCESS,
          `Unauthorized access attempt to ${pathname}`,
          request
        );
        
        // Redirect to signin with return URL
        const signinUrl = new URL('/auth/signin', request.url);
        signinUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(signinUrl);
      }

      // Check role authorization
      const requiredRole = protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
      const userRole = (session.user as any).role || 'customer';

      if (requiredRole !== userRole) {
        // Log unauthorized role access attempt
        await auditLogger.logSecurityEvent(
          AuditEventType.UNAUTHORIZED_ACCESS,
          `User with role ${userRole} attempted to access ${requiredRole} route: ${pathname}`,
          request,
          (session.user as any).id
        );
        
        // User doesn't have required role
        if (userRole === 'admin') {
          // Admin can access everything, redirect to admin dashboard
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
          // Redirect to appropriate dashboard based on user role
          const redirectUrl = getRoleBasedRedirect(userRole);
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      }
    }

    // For root path, redirect based on authentication status and role
    if (pathname === '/') {
      if (session) {
        const role = (session.user as any).role || 'customer';
        if (role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (role === 'provider') {
          return NextResponse.redirect(new URL('/provider/dashboard', request.url));
        }
        // Customers stay on the homepage
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Log middleware errors
    await auditLogger.log({
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.SECURITY_VIOLATION,
      action: 'middleware_error',
      description: `Middleware error for ${pathname}: ${error}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    // On error, allow the request to continue but apply security headers
    return applySecurityHeaders(NextResponse.next());
  }
}

function getRoleBasedRedirect(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'provider':
      return '/provider/dashboard';
    case 'customer':
    default:
      return '/';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};