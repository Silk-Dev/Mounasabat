import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Configuration for the client-side auth instance
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  plugins: [
    adminClient()
  ],
  // Customize redirect behavior
  redirects: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyEmail: "/auth/verify-email",
  },

  // Optional: Configure session refresh behavior
  session: {
    refreshInterval: 5 * 60, // Refresh session every 5 minutes
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
