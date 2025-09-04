import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/database/prisma";

/**
 * Enhanced authentication service with multi-provider support and multi-language capabilities
 */
export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma as any as PrismaClient, {provider: "postgresql"}),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false, // don't allow user to set role
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "fr",
        input: true
      },
      phoneNumber: {
        type: "string",
        required: false,
        input: true,
        validate: (value: string) => {
          // Basic phone number validation
          return /^\+?[\d\s-]{8,}$/.test(value);
        }
      },
      address: {
        type: "string",
        required: false,
        input: true
      },
      preferences: {
        type: "json",
        required: false,
        input: true
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false // Only admins can ban users
      },
      banReason: {
        type: "string",
        required: false,
        input: false // Only admins can set ban reason
      },
      banExpires: {
        type: "date",
        required: false,
        input: false // Only admins can set ban expiration
      }
    }
  }
});
