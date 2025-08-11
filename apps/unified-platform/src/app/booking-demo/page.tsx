'use client';

import React, { useState } from 'react';
import { BookingWizard } from '../../components/booking/BookingWizard';
import { useDataLoader } from '../../hooks/useDataLoader';
import { fetchServices, fetchProviders } from '../../lib/api-client';
import { BookingDemoSkeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import type { Service, Provider, BookingConfirmation } from '../../types';

export default function BookingDemoPage() {
  const [showWizard, setShowWizard] = useState(true);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Fetch real data from the database
  const servicesState = useDataLoader(() => fetchServices({ limit: 20, sortBy: 'name' }));
  const providersState = useDataLoader(() => fetchProviders({ limit: 20, verified: true, sortBy: 'rating' }));

  const handleBookingComplete = (bookingConfirmation: BookingConfirmation) => {
    setConfirmation(bookingConfirmation);
    setShowWizard(false);
  };

  const handleBookingCancel = () => {
    setShowWizard(false);
  };

  const handleStartOver = () => {
    setConfirmation(null);
    setShowWizard(true);
  };

  // Handle loading states
  if (servicesState.loading || providersState.loading) {
    return <BookingDemoSkeleton />;
  }

  // Handle error states
  if (servicesState.error || providersState.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6">
          <EmptyState
            title="Unable to Load Demo Data"
            description={servicesState.error || providersState.error || 'An error occurred while loading the booking demo.'}
            action={{
              label: 'Try Again',
              onClick: () => {
                servicesState.refetch();
                providersState.refetch();
              },
            }}
          />
        </div>
      </div>
    );
  }

  // Handle empty states
  if (servicesState.isEmpty && providersState.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6">
          <EmptyState
            title="No Demo Data Available"
            description="There are currently no services or providers available for the booking demo. Please check back later or contact support."
            action={{
              label: 'Refresh',
              onClick: () => {
                servicesState.refetch();
                providersState.refetch();
              },
            }}
          />
        </div>
      </div>
    );
  }

  if (servicesState.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6">
          <EmptyState
            title="No Services Available"
            description="There are currently no services available for the booking demo."
            action={{
              label: 'Refresh',
              onClick: servicesState.refetch,
            }}
          />
        </div>
      </div>
    );
  }

  if (providersState.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6">
          <EmptyState
            title="No Providers Available"
            description="There are currently no verified providers available for the booking demo."
            action={{
              label: 'Refresh',
              onClick: providersState.refetch,
            }}
          />
        </div>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
              <p className="text-gray-600">Your event services have been successfully booked.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Confirmation Number</p>
                  <p className="font-semibold">{confirmation.confirmationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <p className="font-semibold">{confirmation.eventDetails.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="font-semibold">{confirmation.eventDetails.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold">${confirmation.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Selected Services</h3>
              <div className="space-y-2">
                {confirmation.services.map((service) => (
                  <div key={service.serviceId} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{service.service.name}</p>
                      <p className="text-sm text-gray-600">{service.provider.businessName}</p>
                    </div>
                    <p className="font-semibold">${service.price}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartOver}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showWizard) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Demo</h1>
          <p className="text-gray-600 mb-8">This demo was cancelled.</p>
          <button
            onClick={handleStartOver}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Booking Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Flow Demo</h1>
        <p className="text-gray-600">Experience the complete booking process with sample data</p>
      </div>
      
      <BookingWizard
        services={servicesState.data || []}
        providers={providersState.data || []}
        onBookingComplete={handleBookingComplete}
        onBookingCancel={handleBookingCancel}
      />
    </div>
  );
}