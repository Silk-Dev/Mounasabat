import { getServerSession } from 'next-auth';
import { authOptions } from './auth.config';
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
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    return {
      user: {
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name as string,
        role: (session.user.role as 'customer' | 'provider' | 'admin') || 'customer',
        phoneNumber: session.user.phoneNumber as string | undefined,
        address: session.user.address as string | undefined,
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
