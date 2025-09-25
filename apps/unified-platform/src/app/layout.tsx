import type { Metadata } from "next";
import { Birthstone, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import PerformanceProvider from "@/components/providers/PerformanceProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});
const fontBirthstone = Birthstone({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-birthstone",
  preload: true,
});

export const metadata: Metadata = {
  title: "Mounasabet - Unified Booking Platform",
  description:
    "Discover, compare, and book event services and venues all in one place",
  keywords: ["events", "booking", "venues", "services", "wedding", "party"],
  // Performance optimizations
  other: {
    "theme-color": "#3b82f6",
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for likely external resources */}
        <link rel="dns-prefetch" href="//api.stripe.com" />
        <link rel="dns-prefetch" href="//js.stripe.com" />

        {/* Resource hints */}
        <link rel="prefetch" href="/api/categories" />
        <link rel="prefetch" href="/api/locations" />
      </head>
      <body className={fontBirthstone.variable + " " + inter.className}>
        <PerformanceProvider>
          <AuthProvider>
            <main id="root">{children}</main>
            <Toaster />
          </AuthProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
