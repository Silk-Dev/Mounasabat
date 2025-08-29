import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.AUTH_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client-id';
process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-client-secret';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrismaClient = vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    verification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }));
  
  return {
    PrismaClient: mockPrismaClient,
  };
});

// Mock better-auth
vi.mock('better-auth', () => {
  return {
    betterAuth: vi.fn(() => ({
      options: {
        baseURL: process.env.NEXT_PUBLIC_APP_URL,
        secret: process.env.AUTH_SECRET,
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: true,
          sendResetPassword: vi.fn().mockResolvedValue({ success: true }),
          sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
          passwordValidation: vi.fn((password) => {
            if (password.length < 8) {
              return { valid: false, message: "Password must be at least 8 characters long" };
            }
            if (!/\d/.test(password)) {
              return { valid: false, message: "Password must contain at least one number" };
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
              return { valid: false, message: "Password must contain at least one special character" };
            }
            return { valid: true };
          }),
        },
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ["email", "profile", "openid"],
            redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
            profile: vi.fn((profile) => ({
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              language: profile.locale?.startsWith('ar') ? 'ar' : 'fr',
            })),
          },
          facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            scope: ["email", "public_profile", "user_location"],
            redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/facebook`,
            profile: vi.fn((profile) => ({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              image: profile.picture?.data?.url,
              address: profile.location?.name,
              language: 'fr',
            })),
          },
        },
        plugins: [{ name: 'admin' }],
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
          onError: vi.fn((error, req, res) => {
            if (error.message.includes('email')) {
              return res.status(400).json({ 
                error: 'invalid_email',
                message: 'Invalid email' 
              });
            }
            
            if (error.message.includes('password')) {
              return res.status(400).json({ 
                error: 'invalid_password',
                message: 'Invalid password' 
              });
            }
            
            if (error.message.includes('token')) {
              return res.status(400).json({ 
                error: 'invalid_token',
                message: 'Invalid token' 
              });
            }
            
            return res.status(500).json({ 
              error: 'auth_error',
              message: 'Authentication error' 
            });
          }),
        },
      },
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
      sendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      verifyEmail: vi.fn(),
      resetPassword: vi.fn(),
    })),
    admin: vi.fn(() => ({ name: 'admin' })),
    prismaAdapter: vi.fn(() => ({ name: 'prisma-adapter' })),
  };
});

// Mock better-auth/adapters/prisma
vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn(() => ({ name: 'prisma-adapter' })),
}));

// Mock better-auth/plugins
vi.mock('better-auth/plugins', () => ({
  admin: vi.fn(() => ({ name: 'admin' })),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly testing it
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
