'use client';

import React, { useState } from 'react';
import { Review as ReviewType } from '@/types';
import { Card, CardContent, Badge, Button, Alert, AlertDescription } from '@/components/ui';
import { Star, ThumbsUp, Flag, MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react';
import Image from 'next/image';
import { logger } from '@/lib/production-logger';

interface ReviewProps {
  review: ReviewType;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: (review: ReviewType) => void;
  onDelete?: (reviewId: string) => void;
  onFlag?: (reviewId: string, reason: string) => void;
  onVerify?: (reviewId: string) => void;
  className?: string;
}

const Review: React.FC<ReviewProps> = ({
  review,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
  onFlag,
  onVerify,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const isOwner = currentUserId === review.userId;
  const canEdit = isOwner && !isAdmin;
  const canDelete = isOwner || isAdmin;
  const canFlag = !isOwner && !isAdmin;
  const canVerify = isAdmin;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
    rating, 
    size = 'sm' 
  }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(review.id);
      }
    } catch (error) {
      logger.error('Error deleting review:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    
    try {
      if (onFlag) {
        await onFlag(review.id, flagReason);
      }
      setShowFlagDialog(false);
      setFlagReason('');
    } catch (error) {
      logger.error('Error flagging review:', error);
    }
  };

  const handleVerify = async () => {
    try {
      if (onVerify) {
        await onVerify(review.id);
      }
    } catch (error) {
      logger.error('Error verifying review:', error);
    }
  };

  const isFlagged = review.comment?.startsWith('[FLAGGED:');

  return (
    <Card className={`${className} ${isFlagged ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {review.user.image ? (
              <Image
                src={review.user.image}
                alt={review.user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {review.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{review.user.name}</span>
                  {review.isVerified && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                  {isFlagged && (
                    <Badge variant="destructive" className="text-xs">
                      Flagged
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
              
              {/* Review Actions */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                
                {showActions && (
                  <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          if (onEdit) onEdit(review);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleDelete();
                        }}
                        disabled={isDeleting}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    
                    {canFlag && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          setShowFlagDialog(true);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-orange-600 flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        Report
                      </button>
                    )}
                    
                    {canVerify && !review.isVerified && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          handleVerify();
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-green-600 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Verify
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Review Text */}
            {review.comment && (
              <p className="text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            )}

            {/* Service/Provider Info */}
            {(review.service || review.provider) && (
              <div className="mt-3 text-sm text-gray-500">
                Service: {review.service?.name || 'General'} 
                {review.provider && ` by ${review.provider.name}`}
              </div>
            )}
          </div>
        </div>

        {/* Flag Dialog */}
        {showFlagDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Report Review</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for reporting this review:
              </p>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Reason for reporting..."
                className="w-full border rounded-md p-3 mb-4 resize-none"
                rows={3}
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleFlag}
                  disabled={!flagReason.trim()}
                  className="flex-1"
                >
                  Submit Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFlagDialog(false);
                    setFlagReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Review;