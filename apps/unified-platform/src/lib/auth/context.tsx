"use client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authClient } from "./client";
import type { Session } from "better-auth";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: typeof authClient.signIn;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ReturnType<typeof authClient.getSession> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const initialSession = await authClient.getSession();
        setSession(initialSession);
      } catch (error) {
        console.error("Failed to get session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const value = {
    session,
    isLoading,
    signIn: authClient.signIn,
    signOut: async () => {
      await authClient.signOut();
      setSession(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
