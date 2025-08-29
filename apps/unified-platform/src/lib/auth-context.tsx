'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth';
import { logger } from './logger';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'provider' | 'admin';
  phoneNumber?: string;
  address?: string;
  image?: string;
}

export interface AuthSession {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
}

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (sessionData?.data) {
          const user = sessionData.data.user as any;
          setSession({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: (user.role as 'customer' | 'provider' | 'admin') || 'customer',
              phoneNumber: user.phoneNumber || undefined,
              address: user.address || undefined,
              image: user.image || undefined,
            },
            session: {
              id: sessionData.data.session.id,
              expiresAt: new Date(sessionData.data.session.expiresAt),
            },
          });
        }
      } catch (error) {
        logger.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        // After successful sign in, refresh the session to get full session data
        await refreshSession();
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      logger.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      if (result.data) {
        // After successful sign up, refresh the session to get full session data
        await refreshSession();
        return { success: true };
      }

      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      logger.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      setSession(null);
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      logger.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const result = await authClient.updateUser(data);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      if (result.data && session) {
        setSession({
          ...session,
          user: {
            ...session.user,
            ...data,
          },
        });
        return { success: true };
      }

      return { success: false, error: 'Profile update failed' };
    } catch (error) {
      logger.error('Profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const refreshSession = async () => {
    try {
      const sessionData = await authClient.getSession();
      if (sessionData?.data) {
        const user = sessionData.data.user as any;
        setSession({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user.role as 'customer' | 'provider' | 'admin') || 'customer',
            phoneNumber: user.phoneNumber || undefined,
            address: user.address || undefined,
            image: user.image || undefined,
          },
          session: {
            id: sessionData.data.session.id,
            expiresAt: new Date(sessionData.data.session.expiresAt),
          },
        });
      } else {
        setSession(null);
      }
    } catch (error) {
      logger.error('Failed to refresh session:', error);
      setSession(null);
    }
  };

  const value: AuthContextType = {
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking roles
export function useRole() {
  const { session } = useAuth();
  
  const hasRole = (role: 'customer' | 'provider' | 'admin') => {
    return session?.user.role === role;
  };

  const hasAnyRole = (roles: ('customer' | 'provider' | 'admin')[]) => {
    return session ? roles.includes(session.user.role) : false;
  };

  return {
    role: session?.user.role,
    hasRole,
    hasAnyRole,
    isCustomer: hasRole('customer'),
    isProvider: hasRole('provider'),
    isAdmin: hasRole('admin'),
  };
}
