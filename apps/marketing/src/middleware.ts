import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts'
];

const authRoutes = ['/login', '/register', '/forgot-password'];
const adminPrefix = '/dashboard/admin';
const providerPrefix = '/dashboard/provider';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Handle authentication routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // If user is already authenticated, redirect to appropriate dashboard
      const redirectPath = token.role === 'ADMIN' 
        ? adminPrefix 
        : token.role === 'PROVIDER' 
          ? providerPrefix 
          : '/';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle role-based access control
  if (pathname.startsWith(adminPrefix)) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith(providerPrefix)) {
    if (token.role !== 'PROVIDER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // Handle any other protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
