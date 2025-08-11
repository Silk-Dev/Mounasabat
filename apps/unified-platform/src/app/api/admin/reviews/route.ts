import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/reviews - Get all reviews for admin moderation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'flagged', 'verified', 'all'
    const sortBy = searchParams.get('sortBy') || 'newest';
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let where: any = {};
    
    // Filter by status
    if (status === 'flagged') {
      // In a real app, you'd have a flagged field or separate flagged reviews table
      where.comment = { contains: 'inappropriate' }; // Placeholder logic
    } else if (status === 'verified') {
      where.isVerified = true;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { provider: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

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
              email: true,
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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reviews - Bulk actions on reviews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, reviewIds, reason } = body;

    if (!action || !reviewIds || !Array.isArray(reviewIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'delete':
        // Get reviews before deletion to update provider ratings
        const reviewsToDelete = await prisma.review.findMany({
          where: { id: { in: reviewIds } },
          select: { id: true, providerId: true },
        });

        result = await prisma.review.deleteMany({
          where: { id: { in: reviewIds } },
        });

        // Update provider ratings
        const providerIds = [...new Set(reviewsToDelete.map(r => r.providerId).filter(Boolean))];
        for (const providerId of providerIds) {
          if (providerId) {
            await updateProviderRating(providerId);
          }
        }
        break;

      case 'verify':
        result = await prisma.review.updateMany({
          where: { id: { in: reviewIds } },
          data: { isVerified: true },
        });
        break;

      case 'unverify':
        result = await prisma.review.updateMany({
          where: { id: { in: reviewIds } },
          data: { isVerified: false },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully ${action}d ${result.count} review(s)`,
    });
  } catch (error) {
    console.error('Error performing bulk action on reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform action' },
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
  } else {
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        rating: null,
        reviewCount: 0,
      },
    });
  }
}