'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
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
  const { data: sessionData, isPending: isLoading, error } = authClient.useSession();
  
  const session = sessionData ? {
    user: {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name,
      role: (sessionData.user.role as 'customer' | 'provider' | 'admin') || 'customer',
      phoneNumber: (sessionData.user as any).phoneNumber || undefined,
      address: (sessionData.user as any).address || undefined,
      image: sessionData.user.image || undefined,
    },
    session: {
      id: sessionData.session.id,
      expiresAt: new Date(sessionData.session.expiresAt),
    },
  } : null;

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const result = await authClient.updateUser(data);
      
      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const refreshSession = async () => {
    // With better-auth, this is handled automatically by the useSession hook
    window.location.reload();
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
