import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth/auth";

export async function middleware(request: NextRequest) {
  // Check if the request is for an authenticated route
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
  
  if (isAuthRoute) {
    // Handle auth-related routes with Better Auth
    return auth.handler(request);
  }

  // Get the session from the request
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Protected routes that require authentication
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/profile");

  if (isProtectedRoute && !session) {
    // Redirect to sign in if trying to access protected route without session
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Public routes that should redirect if user is already authenticated
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth/");
  if (isAuthPage && session) {
    // Redirect to dashboard if trying to access auth pages while logged in
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
