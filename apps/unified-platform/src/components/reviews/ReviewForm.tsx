'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Textarea, Alert, AlertDescription } from '@/components/ui';
import { Star, Send, X } from 'lucide-react';

interface ReviewFormProps {
  providerId?: string;
  serviceId?: string;
  bookingId?: string;
  providerName?: string;
  serviceName?: string;
  onSubmit?: (review: ReviewFormData) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  className?: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
  providerId?: string;
  serviceId?: string;
  bookingId?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  providerId,
  serviceId,
  bookingId,
  providerName,
  serviceName,
  onSubmit,
  onCancel,
  isOpen = true,
  className = '',
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData: ReviewFormData = {
        rating,
        comment: comment.trim(),
        providerId,
        serviceId,
        bookingId,
      };

      if (onSubmit) {
        await onSubmit(reviewData);
      } else {
        // Default API call
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...reviewData,
            userId: 'current-user-id', // This should come from auth context
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit review');
        }
      }

      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setRating(0);
        setComment('');
        setSuccess(false);
        if (onCancel) onCancel();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating: React.FC = () => (
    <div className="flex items-center gap-1 mb-4">
      <span className="text-sm font-medium text-gray-700 mr-2">Rating:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating} star{rating !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );

  if (!isOpen) return null;

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Thank you for your review! Your feedback helps other customers make informed decisions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Write a Review
          {(providerName || serviceName) && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              for {serviceName ? `${serviceName} by ` : ''}{providerName}
            </div>
          )}
        </CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <StarRating />

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service provider..."
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;