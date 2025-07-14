import { NextRequest, NextResponse } from "next/server";
import { auth } from "@weddni/database/src/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.getSession({ headers: request.headers });
  const { pathname } = request.nextUrl;

  // Allow access to the sign-in page without authentication
  if (pathname === "/signin") {
    return NextResponse.next();
  }

  // If there's no session, redirect to the sign-in page
  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|signin).*)"],
};
