import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/reviews - Get reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (serviceId) where.serviceId = serviceId;
    if (userId) where.userId = userId;

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

    return NextResponse.json({
      success: true,
      data: reviews,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, providerId, serviceId, rating, comment, bookingId } = body;

    // Validate required fields
    if (!userId || !rating || (!providerId && !serviceId)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this provider/service
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        ...(providerId && { providerId }),
        ...(serviceId && { serviceId }),
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this provider/service' },
        { status: 409 }
      );
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

    // Create the review
    const review = await prisma.review.create({
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

    // Update provider rating and review count
    if (providerId) {
      await updateProviderRating(providerId);
    }

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully',
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// Helper function to update provider rating
async function updateProviderRating(providerId: string) {
  const reviews = await prisma.review.findMany({
    where: { providerId },
    select: { rating: true },
  });

  if (reviews.length > 0) {
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        rating: averageRating,
        reviewCount: reviews.length,
      },
    });
  }
}