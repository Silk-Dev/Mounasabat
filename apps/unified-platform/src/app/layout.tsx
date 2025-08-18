import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import PerformanceProvider from '@/components/providers/PerformanceProvider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
import { logger } from '@/lib/production-logger';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: 'Mounasabet - Unified Booking Platform',
  description: 'Discover, compare, and book event services and venues all in one place',
  keywords: ['events', 'booking', 'venues', 'services', 'wedding', 'party'],
  // Performance optimizations
  other: {
    'theme-color': '#3b82f6',
    'color-scheme': 'light',
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for likely external resources */}
        <link rel="dns-prefetch" href="//api.stripe.com" />
        <link rel="dns-prefetch" href="//js.stripe.com" />
        
        {/* Resource hints */}
        <link rel="prefetch" href="/api/categories" />
        <link rel="prefetch" href="/api/locations" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      logger.info('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      logger.info('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary
          section="root"
          showDetails={process.env.NODE_ENV === 'development'}
        >
          <PerformanceProvider>
            <AuthProvider>
              <div id="root">
                {children}
              </div>
              <Toaster />
            </AuthProvider>
          </PerformanceProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}