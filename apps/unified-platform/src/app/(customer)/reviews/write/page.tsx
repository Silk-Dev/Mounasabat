'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReviewForm } from '@/components/reviews';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui'
import { Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BookingDetails {
  id: string;
  service?: {
    id: string;
    name: string;
    provider: {
      id: string;
      name: string;
    };
  };
  startTime: string;
}

export default function WriteReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bookingId = searchParams.get('booking');
  const providerId = searchParams.get('provider');
  const serviceId = searchParams.get('service');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch booking details');
        }

        setBooking(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const handleReviewSubmit = async (reviewData: any) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          userId: 'current-user-id', // This should come from auth context
          providerId: booking?.service?.provider.id || providerId,
          serviceId: booking?.service?.id || serviceId,
          bookingId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // Redirect to success page or back to bookings
      router.push('/bookings?review=success');
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link 
              href="/bookings" 
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/bookings" 
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          </div>
          
          <p className="text-gray-600">
            Share your experience to help other customers make informed decisions.
          </p>
        </div>

        {/* Booking Details */}
        {booking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Provider:</span> {booking.service?.provider.name}
                </div>
                {booking.service && (
                  <div>
                    <span className="font-medium">Service:</span> {booking.service.name}
                  </div>
                )}
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(booking.startTime).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        <ReviewForm
          providerId={booking?.service?.provider.id || providerId || undefined}
          serviceId={booking?.service?.id || serviceId || undefined}
          bookingId={bookingId || undefined}
          providerName={booking?.service?.provider.name}
          serviceName={booking?.service?.name}
          onSubmit={handleReviewSubmit}
          onCancel={() => router.push('/bookings')}
        />

        {/* Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Review Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Be honest and fair in your review</p>
              <p>• Focus on your actual experience with the service</p>
              <p>• Avoid personal attacks or inappropriate language</p>
              <p>• Include specific details that might help other customers</p>
              <p>• Reviews are public and will be visible to other users</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}