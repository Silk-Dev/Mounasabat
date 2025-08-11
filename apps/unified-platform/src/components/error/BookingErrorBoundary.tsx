'use client';

import React from 'react';
import ErrorBoundary, { ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { Calendar, RefreshCw, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BookingErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, retry }) => {
  const handleSaveProgress = () => {
    // Save current booking progress to localStorage
    const bookingData = sessionStorage.getItem('bookingProgress');
    if (bookingData) {
      localStorage.setItem('savedBooking', bookingData);
      localStorage.setItem('savedBookingTimestamp', Date.now().toString());
    }
    retry();
  };

  const handleStartOver = () => {
    // Clear booking progress and start fresh
    sessionStorage.removeItem('bookingProgress');
    localStorage.removeItem('savedBooking');
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    // Open support contact
    window.location.href = '/support?issue=booking-error';
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Booking Error
          </CardTitle>
          <CardDescription>
            We encountered an issue while processing your booking. Don't worry - your progress may be saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={handleSaveProgress} className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Save Progress & Retry
          </Button>
          <Button variant="outline" onClick={handleStartOver} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button variant="ghost" onClick={handleContactSupport} className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

interface BookingErrorBoundaryProps {
  children: React.ReactNode;
}

const BookingErrorBoundary: React.FC<BookingErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={BookingErrorFallback}
      section="booking"
      onError={(error, errorInfo) => {
        // Log booking-specific error context
        const bookingProgress = sessionStorage.getItem('bookingProgress');
        console.error('Booking error:', {
          error: error.message,
          bookingProgress: bookingProgress ? JSON.parse(bookingProgress) : null,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default BookingErrorBoundary;