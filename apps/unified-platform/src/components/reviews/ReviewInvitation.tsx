'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, AlertDescription } from '@/components/ui';
import { Star, Calendar, MapPin, User } from 'lucide-react';
import ReviewForm from './ReviewForm';
import { logger } from '@/lib/production-logger';

interface ReviewInvitationProps {
  booking: {
    id: string;
    eventDate?: Date;
    service?: {
      id: string;
      name: string;
      provider: {
        id: string;
        name: string;
      };
    };
    user?: {
      id: string;
      name: string;
    };
  };
  onReviewSubmitted?: () => void;
  className?: string;
}

const ReviewInvitation: React.FC<ReviewInvitationProps> = ({
  booking,
  onReviewSubmitted,
  className = '',
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReviewSubmit = async (reviewData: any) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          userId: booking.user?.id,
          providerId: booking.service?.provider.id,
          serviceId: booking.service?.id,
          bookingId: booking.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      setSubmitted(true);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      logger.error('Error submitting review:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Thank you for your review! Your feedback has been submitted successfully.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (showReviewForm) {
    return (
      <ReviewForm
        providerId={booking.service?.provider.id}
        serviceId={booking.service?.id}
        bookingId={booking.id}
        providerName={booking.service?.provider.name}
        serviceName={booking.service?.name}
        onSubmit={handleReviewSubmit}
        onCancel={() => setShowReviewForm(false)}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          How was your experience?
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{booking.service?.provider.name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{booking.service?.name}</span>
              </div>
              
              {booking.eventDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(booking.eventDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Message */}
          <div className="text-center py-4">
            <p className="text-gray-700 mb-4">
              We'd love to hear about your experience with {booking.service?.provider.name}. 
              Your review helps other customers make informed decisions.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Write a Review
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  // Mark as dismissed (in a real app, you'd save this preference)
                  if (onReviewSubmitted) onReviewSubmitted();
                }}
              >
                Maybe Later
              </Button>
            </div>
          </div>

          {/* Benefits of Reviewing */}
          <div className="text-xs text-gray-500 text-center">
            <p>Your review will be verified and help build trust in our community</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewInvitation;