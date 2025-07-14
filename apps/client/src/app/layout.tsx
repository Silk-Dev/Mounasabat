import "@weddni/ui/styles.css";
import { AuthProvider, createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000/api/auth",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider client={authClient}>{children}</AuthProvider>
      </body>
    </html>
  );
}
