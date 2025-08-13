'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import ErrorBoundary, { ErrorBoundaryFallbackProps } from './ErrorBoundary';

interface ErrorBoundaryContextValue {
  reportError: (error: Error, context?: string) => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

export function useErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  return context;
}

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  onError?: (error: Error, context?: string) => void;
}

export function ErrorBoundaryProvider({ children, onError }: ErrorBoundaryProviderProps) {
  const reportError = (error: Error, context?: string) => {
    console.error('Error reported:', error, context);
    onError?.(error, context);
    
    // Send to monitoring service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  };

  return (
    <ErrorBoundaryContext.Provider value={{ reportError }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

// Specialized error boundaries for different sections
export function SearchErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      section="search"
      fallback={SearchErrorFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
}

export function BookingErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      section="booking"
      fallback={BookingErrorFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      section="dashboard"
      fallback={DashboardErrorFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ProviderErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      section="provider"
      fallback={ProviderErrorFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  );
}

// Specialized fallback components
const SearchErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold mb-2">Search Unavailable</h3>
    <p className="text-gray-600 mb-4">
      We're having trouble loading search results. Please try again.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
    >
      Retry Search
    </button>
  </div>
);

const BookingErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold mb-2">Booking Error</h3>
    <p className="text-gray-600 mb-4">
      There was an issue with your booking. Please try again or contact support.
    </p>
    <div className="space-x-2">
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
      >
        Try Again
      </button>
      <button
        onClick={() => window.location.href = '/support'}
        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
      >
        Contact Support
      </button>
    </div>
  </div>
);

const DashboardErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
    <p className="text-gray-600 mb-4">
      Unable to load dashboard data. Please refresh the page.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
    >
      Refresh Dashboard
    </button>
  </div>
);

const ProviderErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold mb-2">Provider Data Error</h3>
    <p className="text-gray-600 mb-4">
      Unable to load provider information. Please try again.
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
    >
      Reload Provider Data
    </button>
  </div>
);