import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { type Language } from "@repo/utils/i18n";

/**
 * Enhanced auth client with multi-provider support
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [adminClient()],
});

/**
 * Registration data interface
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  language?: Language;
  phoneNumber?: string;
  address?: string;
}

/**
 * Enhanced helper functions for authentication with multi-language support
 */
export const authHelpers = {
  /**
   * Enhanced user registration with email verification
   */
  signUp: async (data: RegistrationData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': data.language || 'fr',
      },
      body: JSON.stringify(data),
    });
    
    return response.json();
  },

  /**
   * Request password reset with language preference
   */
  resetPassword: async (email: string, language?: Language) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language || 'fr',
      },
      body: JSON.stringify({ email, language }),
    });
    
    return response.json();
  },

  /**
   * Update password using reset token
   */
  updatePassword: async (token: string, password: string, language?: Language) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language || 'fr',
      },
      body: JSON.stringify({ token, password, language }),
    });
    
    return response.json();
  },

  /**
   * Verify email address using verification token
   */
  verifyEmail: async (token: string, language?: Language) => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language || 'fr',
      },
      body: JSON.stringify({ token, language }),
    });
    
    return response.json();
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string, language?: Language) => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language || 'fr',
      },
      body: JSON.stringify({ email, language }),
    });
    
    return response.json();
  },

  // Enhanced social authentication helpers with language preference
  
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: (callbackURL = "/dashboard", language?: Language) => {
    return authClient.signIn.social({
      provider: "google",
      callbackURL,
      extraParams: language ? { language } : undefined,
    });
  },

  /**
   * Sign in with Facebook OAuth
   */
  signInWithFacebook: (callbackURL = "/dashboard", language?: Language) => {
    return authClient.signIn.social({
      provider: "facebook", 
      callbackURL,
      extraParams: language ? { language } : undefined,
    });
  },

  /**
   * Email/password authentication with language preference
   */
  signInWithEmail: async (email: string, password: string, callbackURL = "/dashboard", language?: Language) => {
    return authClient.signIn.email({
      email,
      password,
      callbackURL,
      extraParams: language ? { language } : undefined,
    });
  },

  /**
   * Sign out with redirect
   */
  signOut: async (redirectUrl = "/") => {
    return authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = redirectUrl;
        },
      },
    });
  },
  
  /**
   * Get current session
   */
  getSession: async () => {
    return authClient.getSession();
  },
  
  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<RegistrationData>) => {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': data.language || 'fr',
      },
      body: JSON.stringify(data),
    });
    
    return response.json();
  },
};