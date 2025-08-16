'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/production-logger';
import { errorHandler } from '@/lib/production-error-handler';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  section?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  retry: () => void;
  section?: string;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Use the production error handler
    const sanitizedError = errorHandler.handleClientError(error, {
      component: this.props.section || 'error_boundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }



  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
          section={this.props.section}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  retry,
  section,
  showDetails = false,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    retry();
    setIsRetrying(false);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  const handleReportError = async () => {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          section,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
      setReportSent(true);
    } catch {
      // Silently fail
    }
  };

  const getSectionIcon = () => {
    switch (section) {
      case 'booking':
        return '📅';
      case 'search':
        return '🔍';
      case 'dashboard':
        return '📊';
      case 'provider':
        return '👤';
      case 'payment':
        return '💳';
      default:
        return '⚠️';
    }
  };

  const getSectionMessage = () => {
    switch (section) {
      case 'booking':
        return 'We encountered an issue while processing your booking. Your progress may have been saved.';
      case 'search':
        return 'We had trouble loading search results. Please try searching again.';
      case 'dashboard':
        return 'Unable to load dashboard data. Please refresh to try again.';
      case 'provider':
        return 'There was an issue loading provider information. Please try again.';
      case 'payment':
        return 'A payment processing error occurred. Please check your payment details and try again.';
      default:
        return 'An unexpected error occurred. We apologize for the inconvenience.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">{getSectionIcon()}</span>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {section ? `${section.charAt(0).toUpperCase() + section.slice(1)} Error` : 'Something went wrong'}
          </CardTitle>
          <CardDescription className="text-base">
            {getSectionMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleGoBack} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>

            {!reportSent ? (
              <Button 
                variant="ghost" 
                onClick={handleReportError} 
                className="w-full text-sm"
              >
                📧 Report this issue
              </Button>
            ) : (
              <div className="text-center text-sm text-green-600 py-2">
                ✅ Error report sent. Thank you!
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> If this error persists, please contact our support team 
              with the error details below.
            </p>
          </div>

          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                🔧 Technical Details (Development Only)
              </summary>
              <div className="mt-3 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-800 overflow-auto max-h-60">
                <div className="mb-3">
                  <strong className="text-red-600">Error:</strong> {error.message}
                </div>
                <div className="mb-3">
                  <strong className="text-blue-600">Type:</strong> {error.constructor.name}
                </div>
                {error.stack && (
                  <div className="mb-3">
                    <strong className="text-purple-600">Stack Trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong className="text-green-600">Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorBoundary;