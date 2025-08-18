import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { sendEmail } from "./email-service";
import { getAuthMessages, detectLanguage, type Language } from '@/lib/utils';

const prisma = new PrismaClient();

/**
 * Enhanced authentication service with multi-provider support and multi-language capabilities
 */
export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
