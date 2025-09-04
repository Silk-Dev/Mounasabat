"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authClient } from "./client";
import type { Session } from "better-auth";
import { unsubscribe } from "diagnostics_channel";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: typeof authClient.signIn.email;
  signOut: typeof authClient.signOut;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ReturnType<typeof authClient.getSession> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
   
    // Initial session check
    authClient.getSession().then((initialSession) => {
      setSession(initialSession);
      setIsLoading(false);
    });

    return () => {
    };
  }, []);

  const value = {
    session,
    isLoading,
    signIn: authClient.signIn.email,
    signOut: authClient.signOut,
  };

  return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
