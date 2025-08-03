import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { sendEmail } from "./email-service";
import { getAuthMessages, detectLanguage, type Language } from "@repo/utils/i18n";

const prisma = new PrismaClient();

/**
 * Enhanced authentication service with multi-provider support and multi-language capabilities
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Enhanced password reset functionality with secure token generation
    sendResetPassword: async ({ user, url, token }) => {
      try {
        // Detect user language from user preferences or default to French
        const userLanguage = (user.language as Language) || 'fr';
        const messages = getAuthMessages(userLanguage);
        
        await sendEmail({
          to: user.email,
          subject: userLanguage === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Réinitialisation du mot de passe',
          template: 'password-reset',
          data: {
            name: user.name,
            resetUrl: url,
            token,
            language: userLanguage,
            messages: messages.passwordReset,
          },
        });
        
        console.log(`Password reset email sent to ${user.email} in ${userLanguage}`);
        return { success: true };
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
      }
    },
    // Enhanced email verification with multi-language support
    sendVerificationEmail: async ({ user, url, token }) => {
      try {
        // Detect user language from user preferences or default to French
        const userLanguage = (user.language as Language) || 'fr';
        const messages = getAuthMessages(userLanguage);
        
        await sendEmail({
          to: user.email,
          subject: userLanguage === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Vérification de votre email',
          template: 'email-verification',
          data: {
            name: user.name,
            verificationUrl: url,
            token,
            language: userLanguage,
            messages: messages.registration,
          },
        });
        
        console.log(`Email verification sent to ${user.email} in ${userLanguage}`);
        return { success: true };
      } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
      }
    },
    // Enhanced validation for password security
    passwordValidation: (password) => {
      if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters long" };
      }
      
      // Check for at least one number
      if (!/\d/.test(password)) {
        return { valid: false, message: "Password must contain at least one number" };
      }
      
      // Check for at least one special character
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: "Password must contain at least one special character" };
      }
      
      return { valid: true };
    },
  },
  // Enhanced social provider configuration with additional options
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["email", "profile", "openid"],
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      // Custom profile handler to extract additional information
      profile: (profile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Set default language based on Google profile locale
          language: profile.locale?.startsWith('ar') ? 'ar' : 'fr',
        };
      },
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      scope: ["email", "public_profile", "user_location"],
      redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/facebook`,
      // Custom profile handler to extract additional information
      profile: (profile) => {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          // Extract location if available
          address: profile.location?.name,
          // Default to French for Facebook logins
          language: 'fr',
        };
      },
    },
  },
  plugins: [admin()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      language: {
        type: "string",
        defaultValue: "fr",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      preferences: {
        type: "object",
        required: false,
      },
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    // Enhanced error handling
    onError: (error, req, res) => {
      console.error('Authentication error:', error);
      
      // Detect user language from request headers
      const acceptLanguage = req.headers['accept-language'];
      const language = detectLanguage(acceptLanguage);
      const messages = getAuthMessages(language);
      
      // Return appropriate error message based on error type
      if (error.message.includes('email')) {
        return res.status(400).json({ 
          error: 'invalid_email',
          message: messages.validation.invalidEmail 
        });
      }
      
      if (error.message.includes('password')) {
        return res.status(400).json({ 
          error: 'invalid_password',
          message: messages.validation.passwordMinLength 
        });
      }
      
      if (error.message.includes('token')) {
        return res.status(400).json({ 
          error: 'invalid_token',
          message: messages.passwordReset.invalidToken 
        });
      }
      
      // Default error response
      return res.status(500).json({ 
        error: 'auth_error',
        message: language === 'ar' ? 'حدث خطأ في المصادقة' : 'Une erreur d\'authentification s\'est produite' 
      });
    },
  },
});
