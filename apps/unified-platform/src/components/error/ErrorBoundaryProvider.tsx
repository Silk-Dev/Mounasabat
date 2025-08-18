'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import ErrorBoundary, { ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { logger } from '@/lib/production-logger';
import { errorHandler } from '@/lib/production-error-handler';

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
    // Use the production error handler
    const sanitizedError = errorHandler.handleClientError(error, {
      component: context || 'error_boundary_provider',
    });
    
    onError?.(error, context);
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
const SearchErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    retry();
    setIsRetrying(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">🔍</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Search Unavailable</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        We're having trouble loading search results. This might be a temporary issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Retry Search
            </>
          )}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

const BookingErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    retry();
    setIsRetrying(false);
  };

  const handleSaveProgress = () => {
    // Save current booking progress
    const bookingData = sessionStorage.getItem('bookingProgress');
    if (bookingData) {
      localStorage.setItem('savedBooking', bookingData);
      localStorage.setItem('savedBookingTimestamp', Date.now().toString());
    }
    handleRetry();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">📅</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Booking Error</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        There was an issue processing your booking. Don't worry - your progress may have been saved.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </>
          )}
        </button>
        <button
          onClick={handleSaveProgress}
          className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5"
        >
          Save Progress & Retry
        </button>
        <button
          onClick={() => window.location.href = '/support?issue=booking-error'}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

const DashboardErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    retry();
    setIsRetrying(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">📊</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Dashboard Error</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Unable to load dashboard data. This might be a temporary connectivity issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Dashboard
            </>
          )}
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

const ProviderErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    retry();
    setIsRetrying(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl">👤</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Provider Data Error</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Unable to load provider information. Please try again in a moment.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Reload Provider Data
            </>
          )}
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};