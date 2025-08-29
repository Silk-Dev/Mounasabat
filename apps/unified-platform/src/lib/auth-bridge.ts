import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Bridge functions to help migrate from better-auth to NextAuth.js
export const auth = {
  // Session management
  getSession: async () => {
    return await getServerSession(authOptions);
  },

  // User management
  getUser: async () => {
    const session = await getServerSession(authOptions);
    return session?.user;
  },

  // Authentication status
  isAuthenticated: async () => {
    const session = await getServerSession(authOptions);
    return !!session;
  }
};

// Client-side auth bridge
export const createAuthClient = () => {
  return {
    getSession: async () => {
      // Use the native next-auth/react useSession hook in components instead
      const session = await getServerSession(authOptions);
      return session;
    },
    
    signIn: async (credentials: any) => {
      // Use the next-auth/react signIn function in components instead
      throw new Error('Please use next-auth/react signIn function instead');
    },
    
    signOut: async () => {
      // Use the next-auth/react signOut function in components instead
      throw new Error('Please use next-auth/react signOut function instead');
    }
  };
};
