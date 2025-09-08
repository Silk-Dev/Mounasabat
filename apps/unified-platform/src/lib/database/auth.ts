import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  project: ["create", "share", "update", "delete"],
} as const;
const ac = createAccessControl(statement)
const provider = ac.newRole({
  project: ["create", "share", "update", "delete"],
})
const customer = ac.newRole({
  project: ["create", "share", "update", "delete"],
})
const prisma = new PrismaClient();

/**
 * Enhanced authentication service with multi-provider support and multi-language capabilities
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or your database provider
  }),
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
  additionalFields: {
    role: {
      type: "string",
      required: true,
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        customer,
        provider
      },
    })
  ],
});
