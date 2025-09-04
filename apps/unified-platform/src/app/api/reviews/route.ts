import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/production-logger';
import { withApiMiddleware, withAuth } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';
import { validateRequiredFields } from '@/lib/api-response';

const prisma = new PrismaClient();

// Validation schemas
const reviewsQuerySchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format').optional(),
  serviceId: z.string().uuid('Invalid service ID format').optional(),
  userId: z.string().uuid('Invalid user ID format').optional(),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  offset: z.string().transform(val => Math.max(0, parseInt(val) || 0)),
  sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
});

const createReviewSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  providerId: z.string().uuid('Invalid provider ID format').optional(),
  serviceId: z.string().uuid('Invalid service ID format').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .transform(str => str.trim()),
  bookingId: z.string().uuid('Invalid booking ID format').optional(),
}).refine(data => data.providerId || data.serviceId, {
  message: "Either providerId or serviceId must be provided",
});

// GET /api/reviews - Get reviews with filtering
async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Validate and sanitize query parameters
  const validatedQuery = reviewsQuerySchema.parse(queryParams);
  
  const { providerId, serviceId, userId, limit, offset, sortBy } = validatedQuery;

  // Build where clause
  const where: any = {};
  if (providerId) where.providerId = providerId;
  if (serviceId) where.serviceId = serviceId;
  if (userId) where.userId = userId;

  // Build order by clause
  let orderBy: any = { createdAt: 'desc' };
  switch (sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'highest':
      orderBy = { rating: 'desc' };
      break;
    case 'lowest':
      orderBy = { rating: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.review.count({ where }),
  ]);

  // Calculate rating statistics
  const ratingStats = await prisma.review.groupBy({
    by: ['rating'],
    where,
    _count: {
      rating: true,
    },
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return ApiResponseBuilder.success({
    reviews,
    statistics: {
      total,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: ratingStats.reduce((acc, stat) => {
        acc[stat.rating] = stat._count.rating;
        return acc;
      }, {} as Record<number, number>),
    },
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < total,
      total,
    },
  }, 'Reviews retrieved successfully');
}

// POST /api/reviews - Create a new review
async function handlePOST(request: NextRequest) {
  const body = await request.json();

  // Validate required fields
  const requiredFields = ['userId', 'rating'];
  const missingFields = validateRequiredFields(body, requiredFields);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate and sanitize data
  const validatedData = createReviewSchema.parse(body);
  const { userId, providerId, serviceId, rating, comment, bookingId } = validatedData;

  // Check if user has already reviewed this provider/service
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      ...(providerId && { providerId }),
      ...(serviceId && { serviceId }),
    },
  });

  if (existingReview) {
    return ApiResponseBuilder.error(
      'Duplicate Review',
      409,
      'You have already reviewed this provider/service',
      'DUPLICATE_REVIEW'
    );
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return ApiResponseBuilder.notFound('User');
  }

  // Verify provider exists if provided
  if (providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true },
    });

    if (!provider) {
      return ApiResponseBuilder.notFound('Provider');
    }
  }

  // Verify service exists if provided
  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true },
    });

    if (!service) {
      return ApiResponseBuilder.notFound('Service');
    }
  }

  // Verify user has completed booking (if bookingId provided)
  let isVerified = false;
  if (bookingId) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        status: 'DELIVERED',
      },
    });
    isVerified = !!booking;
  }

  // Create the review in a transaction
  const review = await prisma.$transaction(async (tx) => {
    // Create the review
    const newReview = await tx.review.create({
      data: {
        userId,
        providerId,
        serviceId,
        rating,
        comment,
        isVerified,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update provider rating and review count if applicable
    if (providerId) {
      await updateProviderRating(tx, providerId);
    }

    // Update service rating if applicable
    if (serviceId) {
      await updateServiceRating(tx, serviceId);
    }

    return newReview;
  });

  return ApiResponseBuilder.success(
    { review },
    'Review created successfully'
  );
}

// Helper function to update provider rating
async function updateProviderRating(tx: any, providerId: string) {
  const reviews = await tx.review.findMany({
    where: { providerId },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
    
    await tx.provider.update({
      where: { id: providerId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: reviews.length,
      },
    });
  }
}

// Helper function to update service rating
async function updateServiceRating(tx: any, serviceId: string) {
  const reviews = await tx.review.findMany({
    where: { serviceId },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
    
    await tx.service.update({
      where: { id: serviceId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviewCount: reviews.length,
      },
    });
  }
}

// Export wrapped handlers with proper error handling
export const GET = withApiMiddleware(handleGET, {
  component: 'reviews_api',
  logRequests: true,
});

export const POST = withAuth(handlePOST, {
  component: 'reviews_api',
  roles: ['customer', 'admin'], // Only customers and admins can create reviews
});