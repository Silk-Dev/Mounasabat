import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/../../packages/database/src/generated/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user statistics
    const [bookingsCount, reviewsCount, favoritesCount, userReviews, completedBookings] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { userId },
      }),
      
      // Total reviews written by user
      prisma.review.count({
        where: { userId },
      }),
      
      // Total favorites
      prisma.favorite.count({
        where: { userId },
      }),
      
      // User's reviews to calculate average rating given by user
      prisma.review.findMany({
        where: { userId },
        select: { rating: true },
      }),

      // Completed bookings for more accurate stats
      prisma.booking.count({
        where: { 
          userId,
          status: { in: ['DELIVERED', 'PAID'] }
        },
      }),
    ]);

    // Calculate average rating given by user
    const averageRating = userReviews.length > 0
      ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length
      : 0;

    const stats = {
      totalBookings: bookingsCount,
      completedBookings,
      totalReviews: reviewsCount,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      favoriteCount: favoritesCount,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}