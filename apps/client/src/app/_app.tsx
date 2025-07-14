import type { AppProps } from "next/app";
import { AuthProvider, createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000/api/auth",
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider client={authClient}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
