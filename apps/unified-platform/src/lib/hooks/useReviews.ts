'use client';

import { useState, useEffect, useCallback } from 'react';
import { Review } from '@/types';

interface UseReviewsOptions {
  providerId?: string;
  serviceId?: string;
  userId?: string;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  submitReview: (reviewData: {
    rating: number;
    comment?: string;
    providerId?: string;
    serviceId?: string;
    bookingId?: string;
  }) => Promise<void>;
  updateReview: (reviewId: string, updates: {
    rating?: number;
    comment?: string;
  }) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
}

export function useReviews(options: UseReviewsOptions = {}): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const {
    providerId,
    serviceId,
    userId,
    limit = 10,
    sortBy = 'newest',
  } = options;

  const fetchReviews = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: reset ? '0' : offset.toString(),
        sortBy,
        ...(providerId && { providerId }),
        ...(serviceId && { serviceId }),
        ...(userId && { userId }),
      });

      const response = await fetch(`/api/reviews?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reviews');
      }

      if (reset) {
        setReviews(result.data);
        setOffset(result.data.length);
      } else {
        setReviews(prev => [...prev, ...result.data]);
        setOffset(prev => prev + result.data.length);
      }

      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [providerId, serviceId, userId, limit, sortBy, offset]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchReviews(true);
  }, [fetchReviews]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchReviews(false);
  }, [fetchReviews, hasMore, loading]);

  const submitReview = useCallback(async (reviewData: {
    rating: number;
    comment?: string;
    providerId?: string;
    serviceId?: string;
    bookingId?: string;
  }) => {
    try {
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

      // Add the new review to the beginning of the list
      setReviews(prev => [result.data, ...prev]);
      setTotal(prev => prev + 1);
    } catch (err) {
      throw err;
    }
  }, []);

  const updateReview = useCallback(async (reviewId: string, updates: {
    rating?: number;
    comment?: string;
  }) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          userId: 'current-user-id', // This should come from auth context
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update review');
      }

      // Update the review in the list
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId ? result.data : review
        )
      );
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete review');
      }

      // Remove the review from the list
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setTotal(prev => prev - 1);
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchReviews(true);
  }, [providerId, serviceId, userId, sortBy]);

  return {
    reviews,
    loading,
    error,
    hasMore,
    total,
    refetch,
    loadMore,
    submitReview,
    updateReview,
    deleteReview,
  };
}

/**
 * Hook for managing pending review invitations
 */
export function usePendingReviews(userId?: string) {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingReviews = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reviews/invite?userId=${userId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pending reviews');
      }

      setPendingReviews(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending reviews');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsReviewed = useCallback((bookingId: string) => {
    setPendingReviews(prev => 
      prev.filter(booking => booking.id !== bookingId)
    );
  }, []);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  return {
    pendingReviews,
    loading,
    error,
    refetch: fetchPendingReviews,
    markAsReviewed,
  };
}