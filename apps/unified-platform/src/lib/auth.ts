import { auth } from '@/lib/database/auth';
import { headers } from 'next/headers';
import { logger } from './logger';

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'provider' | 'admin';
    phoneNumber?: string;
    address?: string;
  };
};

// Server-side session management (for server components and API routes)
export async function getSession(request?: Request): Promise<Session | null> {
  try {
    const headersList = await headers();
    const sessionData = await auth.api.getSession({
      headers: headersList,
    });
    
    if (!sessionData?.user) return null;

    return {
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: (sessionData.user.role as 'customer' | 'provider' | 'admin') || 'customer',
        phoneNumber: (sessionData.user as any).phoneNumber || undefined,
        address: (sessionData.user as any).address || undefined,
      }
    };
  } catch (error) {
    logger.error('Error getting session:', error);
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

// Export the auth instance for direct use in API routes
export { auth };