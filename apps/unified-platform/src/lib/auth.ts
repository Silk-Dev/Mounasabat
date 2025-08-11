// Authentication utilities for the unified platform
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'provider' | 'admin';
    phoneNumber?: string;
    address?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
};

// Server-side session management (for server components and API routes)
export async function getSession(request?: Request): Promise<Session | null> {
  try {
    const cookie = request?.headers?.get('cookie') || '';
    
    if (!cookie) {
      return null;
    }

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie,
      }),
    });

    if (!session) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: ((session.user as any).role as 'customer' | 'provider' | 'admin') || 'customer',
        phoneNumber: (session.user as any).phoneNumber || undefined,
        address: (session.user as any).address || undefined,
      },
      session: {
        id: session.session.id,
        expiresAt: new Date(session.session.expiresAt),
      },
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function requireAuth(request?: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireRole(role: 'customer' | 'provider' | 'admin', request?: Request): Promise<Session> {
  const session = await requireAuth(request);
  if (session.user.role !== role) {
    throw new Error(`Role ${role} required`);
  }
  return session;
}

// Role checking utilities
export function hasRole(session: Session | null, role: 'customer' | 'provider' | 'admin'): boolean {
  return session?.user.role === role;
}

export function hasAnyRole(session: Session | null, roles: ('customer' | 'provider' | 'admin')[]): boolean {
  return session ? roles.includes(session.user.role) : false;
}

// Client-side auth utilities (to be used in client components)
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});