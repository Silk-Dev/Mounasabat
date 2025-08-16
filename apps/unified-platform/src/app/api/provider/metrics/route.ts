import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { logger } from '../../../../lib/production-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get current date for monthly calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch provider data
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        serviceOfferings: {
          where: { isActive: true }
        },
        reviews: true
      }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get booking statistics
    const [
      totalBookings,
      pendingBookings,
      completedBookings,
      monthlyBookings,
      recentBookings
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { providerId }
      }),
      
      // Pending bookings
      prisma.booking.count({
        where: { 
          providerId,
          status: 'PENDING'
        }
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: { 
          providerId,
          status: 'CONFIRMED'
        }
      }),
      
      // Monthly bookings for revenue calculation
      prisma.booking.findMany({
        where: {
          providerId,
          status: 'CONFIRMED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          service: true
        }
      }),
      
      // Recent bookings
      prisma.booking.findMany({
        where: { providerId },
        include: {
          service: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

    // Calculate monthly revenue (simplified - using service base price)
    const monthlyRevenue = monthlyBookings.reduce((total, booking) => {
      return total + (booking.service?.basePrice || 0);
    }, 0);

    // Calculate average rating
    const averageRating = provider.reviews.length > 0
      ? provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length
      : 0;

    const metrics = {
      totalBookings,
      monthlyRevenue,
      activeServices: provider.serviceOfferings.length,
      averageRating,
      pendingBookings,
      completedBookings,
      recentBookings
    };

    return NextResponse.json({
      success: true,
      ...metrics
    });

  } catch (error) {
    logger.error('Error fetching provider metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch provider metrics' 
      },
      { status: 500 }
    );
  }
}