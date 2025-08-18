'use client';

import React, { useState, useEffect } from 'react';
import { Review as ReviewType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Alert, AlertDescription } from '@/components/ui';
import { Star, Search, Filter, Shield, Flag, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Review from './Review';

interface ReviewModerationProps {
  className?: string;
}

interface ReviewWithUser extends ReviewType {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  provider?: {
    id: string;
    name: string;
  };
  service?: {
    id: string;
    name: string;
  };
}

const ReviewModeration: React.FC<ReviewModerationProps> = ({ className = '' }) => {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
        sortBy,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/reviews?${params}`);
      const result = await response.json();

      if (result.success) {
        setReviews(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError(result.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter, sortBy, searchTerm]);

  const handleBulkAction = async (action: 'delete' | 'verify' | 'unverify') => {
    if (selectedReviews.length === 0) return;

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          reviewIds: selectedReviews,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setSelectedReviews([]);
        fetchReviews();
      } else {
        setError(result.error || 'Failed to perform action');
      }
    } catch (err) {
      setError('Failed to perform action');
    }
  };

  const handleReviewAction = async (reviewId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action === 'delete' 
          ? undefined 
          : JSON.stringify({ action, reason }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        fetchReviews();
      } else {
        setError(result.error || 'Failed to perform action');
      }
    } catch (err) {
      setError('Failed to perform action');
    }
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedReviews(
      selectedReviews.length === reviews.length 
        ? [] 
        : reviews.map(review => review.id)
    );
  };

  const getStatusBadge = (review: ReviewWithUser) => {
    const isFlagged = review.comment?.startsWith('[FLAGGED:');
    
    if (isFlagged) {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (review.isVerified) {
      return <Badge variant="secondary">Verified</Badge>;
    }
    return <Badge variant="outline">Unverified</Badge>;
  };

  const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Review Moderation
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews, users, or providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReviews.length} review{selectedReviews.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('verify')}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('unverify')}
                  >
                    Unverify
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Reviews Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <div className="grid grid-cols-12 gap-4 flex-1 text-sm font-medium text-gray-700">
                  <div className="col-span-3">User & Review</div>
                  <div className="col-span-2">Provider/Service</div>
                  <div className="col-span-2">Rating</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No reviews found
              </div>
            ) : (
              <div className="divide-y">
                {reviews.map((review) => (
                  <div key={review.id} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedReviews.includes(review.id)}
                        onCheckedChange={() => toggleReviewSelection(review.id)}
                      />
                      
                      <div className="grid grid-cols-12 gap-4 flex-1">
                        {/* User & Review */}
                        <div className="col-span-3">
                          <div className="font-medium text-sm">{review.user.name}</div>
                          <div className="text-xs text-gray-500">{review.user.email}</div>
                          {review.comment && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {review.comment.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                        
                        {/* Provider/Service */}
                        <div className="col-span-2">
                          <div className="text-sm font-medium">{review.provider?.name}</div>
                          {review.service && (
                            <div className="text-xs text-gray-500">{review.service.name}</div>
                          )}
                        </div>
                        
                        {/* Rating */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="col-span-2">
                          {getStatusBadge(review)}
                        </div>
                        
                        {/* Date */}
                        <div className="col-span-2">
                          <div className="text-sm text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReviewAction(review.id, 'verify')}
                              disabled={review.isVerified}
                            >
                              <Shield className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReviewAction(review.id, 'delete')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewModeration;