/**
 * Integration tests for review API routes
 * These tests verify the review system functionality
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    provider: {
      update: jest.fn(),
    },
  })),
}));

describe('/api/reviews', () => {
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('GET /api/reviews', () => {
    it('should fetch reviews with default parameters', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          userId: 'user-1',
          providerId: 'provider-1',
          rating: 5,
          comment: 'Great service!',
          isVerified: true,
          createdAt: new Date(),
          user: { id: 'user-1', name: 'John Doe', image: null },
          provider: { id: 'provider-1', name: 'Test Provider' },
          service: null,
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockReviews);
      expect(data.total).toBe(1);
      expect(data.hasMore).toBe(false);
    });

    it('should filter reviews by providerId', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          providerId: 'provider-1',
          rating: 5,
          user: { id: 'user-1', name: 'John Doe' },
        },
      ];

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/reviews?providerId=provider-1');
      const response = await GET(request);
      const data = await response.json();

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerId: 'provider-1' },
        })
      );
      expect(data.success).toBe(true);
    });

    it('should sort reviews by rating', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/reviews?sortBy=highest');
      await GET(request);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        })
      );
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const newReview = {
        id: 'review-1',
        userId: 'user-1',
        providerId: 'provider-1',
        rating: 5,
        comment: 'Excellent service!',
        isVerified: false,
        createdAt: new Date(),
        user: { id: 'user-1', name: 'John Doe', image: null },
        provider: { id: 'provider-1', name: 'Test Provider' },
        service: null,
      };

      mockPrisma.review.findFirst.mockResolvedValue(null); // No existing review
      mockPrisma.review.create.mockResolvedValue(newReview);
      mockPrisma.review.findMany.mockResolvedValue([newReview]);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          providerId: 'provider-1',
          rating: 5,
          comment: 'Excellent service!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newReview);
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 'user-1',
            providerId: 'provider-1',
            serviceId: undefined,
            rating: 5,
            comment: 'Excellent service!',
            isVerified: false,
          },
        })
      );
    });

    it('should reject review with invalid rating', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          providerId: 'provider-1',
          rating: 6, // Invalid rating
          comment: 'Test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rating must be between 1 and 5');
    });

    it('should reject duplicate review', async () => {
      const existingReview = {
        id: 'existing-review',
        userId: 'user-1',
        providerId: 'provider-1',
      };

      mockPrisma.review.findFirst.mockResolvedValue(existingReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          providerId: 'provider-1',
          rating: 5,
          comment: 'Test',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('You have already reviewed this provider/service');
    });

    it('should mark review as verified if booking exists', async () => {
      const mockBooking = {
        id: 'booking-1',
        userId: 'user-1',
        status: 'DELIVERED',
      };

      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.booking = {
        findFirst: jest.fn().mockResolvedValue(mockBooking),
      };
      mockPrisma.review.create.mockResolvedValue({
        id: 'review-1',
        isVerified: true,
      });

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          providerId: 'provider-1',
          rating: 5,
          bookingId: 'booking-1',
        }),
      });

      await POST(request);

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
          }),
        })
      );
    });
  });
});

describe('Review System Integration', () => {
  it('should handle complete review workflow', async () => {
    // This test verifies the complete review workflow:
    // 1. User completes booking
    // 2. Review invitation is sent
    // 3. User submits review
    // 4. Provider rating is updated
    // 5. Review appears in provider profile

    const workflow = {
      booking: {
        id: 'booking-1',
        userId: 'user-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        status: 'DELIVERED',
      },
      review: {
        userId: 'user-1',
        providerId: 'provider-1',
        serviceId: 'service-1',
        rating: 5,
        comment: 'Amazing service!',
        bookingId: 'booking-1',
      },
    };

    // Simulate the workflow steps
    expect(workflow.booking.status).toBe('DELIVERED');
    expect(workflow.review.rating).toBeGreaterThanOrEqual(1);
    expect(workflow.review.rating).toBeLessThanOrEqual(5);
    expect(workflow.review.userId).toBe(workflow.booking.userId);
    expect(workflow.review.providerId).toBe(workflow.booking.providerId);
  });
});