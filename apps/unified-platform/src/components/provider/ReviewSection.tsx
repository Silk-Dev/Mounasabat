'use client';

import React, { useState } from 'react';
import { Review as ReviewType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from '@/components/ui';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Review } from '@/components/reviews';
import { logger } from '@/lib/production-logger';

interface ReviewSectionProps {
  reviews: ReviewType[];
  averageRating: number;
  totalReviews: number;
  currentUserId?: string;
  className?: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  reviews, 
  averageRating, 
  totalReviews,
  currentUserId,
  className = '' 
}) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => review.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const displayedReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 5);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
    rating, 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleReviewEdit = (review: ReviewType) => {
    // Handle review editing - could open a modal or navigate to edit page
    logger.info('Edit review:', review.id);
  };

  const handleReviewDelete = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh reviews or remove from local state
        window.location.reload();
      }
    } catch (error) {
      logger.error('Error deleting review:', error);
    }
  };

  const handleReviewFlag = async (reviewId: string, reason: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Show success message
        logger.info('Review flagged successfully');
      }
    } catch (error) {
      logger.error('Error flagging review:', error);
    }
  };

  if (reviews.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <div className="text-gray-500 mb-2">No reviews yet</div>
          <div className="text-sm text-gray-400">
            Be the first to leave a review for this provider.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews & Ratings</span>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} size="lg" />
              <div className="text-sm text-gray-500 mt-2">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Reviews
            </h3>
            
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <Review 
                  key={review.id} 
                  review={review}
                  currentUserId={currentUserId}
                  onEdit={handleReviewEdit}
                  onDelete={handleReviewDelete}
                  onFlag={handleReviewFlag}
                />
              ))}
            </div>

            {/* Show More/Less Button */}
            {reviews.length > 5 && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="flex items-center gap-2"
                >
                  {showAllReviews ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show All {reviews.length} Reviews
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewSection;