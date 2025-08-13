import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (timeRange) {
      case '7d':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case '90d':
        currentPeriodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case '1y':
        currentPeriodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      default: // 30d
        currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
    }

    // Fetch current period data
    const [
      currentBookings,
      previousBookings,
      allBookings,
      reviews,
      services
    ] = await Promise.all([
      // Current period bookings
      prisma.booking.findMany({
        where: {
          providerId,
          status: 'CONFIRMED',
          createdAt: {
            gte: currentPeriodStart,
            lte: now
          }
        },
        include: {
          service: {
            select: {
              basePrice: true
            }
          }
        }
      }),

      // Previous period bookings
      prisma.booking.findMany({
        where: {
          providerId,
          status: 'CONFIRMED',
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        },
        include: {
          service: {
            select: {
              basePrice: true
            }
          }
        }
      }),

      // All bookings for customer analysis
      prisma.booking.findMany({
        where: { providerId },
        include: {
          user: {
            select: {
              id: true
            }
          },
          service: {
            select: {
              basePrice: true
            }
          }
        }
      }),

      // Reviews
      prisma.review.findMany({
        where: { providerId }
      }),

      // Services for performance analysis
      prisma.service.findMany({
        where: { providerId },
        include: {
          bookings: {
            where: {
              status: 'CONFIRMED',
              createdAt: {
                gte: currentPeriodStart
              }
            }
          }
        }
      })
    ]);

    // Calculate revenue
    const currentRevenue = currentBookings.reduce((sum, booking) => 
      sum + (booking.service?.basePrice || 0), 0
    );
    const previousRevenue = previousBookings.reduce((sum, booking) => 
      sum + (booking.service?.basePrice || 0), 0
    );

    // Calculate changes
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const bookingsChange = previousBookings.length > 0 
      ? ((currentBookings.length - previousBookings.length) / previousBookings.length) * 100 
      : 0;

    // Customer analysis
    const uniqueCustomers = new Set(allBookings.map(b => b.user?.id)).size;
    const customerBookingCounts = allBookings.reduce((acc, booking) => {
      const userId = booking.user?.id;
      if (userId) {
        acc[userId] = (acc[userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const newCustomers = Object.values(customerBookingCounts).filter(count => count === 1).length;
    const returningCustomers = uniqueCustomers - newCustomers;

    // Rating analysis
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Monthly data (simplified - last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthBookings = allBookings.filter(booking => 
        booking.createdAt >= monthStart && booking.createdAt <= monthEnd && booking.status === 'CONFIRMED'
      );
      
      const monthRevenue = monthBookings.reduce((sum, booking) => 
        sum + (booking.service?.basePrice || 0), 0
      );

      monthlyData.push({
        month: monthStart.toLocaleDateString('en', { month: 'short' }),
        revenue: monthRevenue,
        bookings: monthBookings.length
      });
    }

    // Service performance
    const servicePerformance = services.map(service => ({
      name: service.name,
      bookings: service.bookings.length,
      revenue: service.bookings.reduce((sum, booking) => sum + (service.basePrice || 0), 0)
    })).sort((a, b) => b.revenue - a.revenue);

    const analytics = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        trend: revenueChange >= 0 ? 'up' as const : 'down' as const
      },
      bookings: {
        current: currentBookings.length,
        previous: previousBookings.length,
        change: bookingsChange,
        trend: bookingsChange >= 0 ? 'up' as const : 'down' as const
      },
      customers: {
        total: uniqueCustomers,
        new: newCustomers,
        returning: returningCustomers
      },
      rating: {
        average: averageRating,
        totalReviews: reviews.length,
        distribution: ratingDistribution
      },
      monthlyData,
      servicePerformance
    };

    return NextResponse.json({
      success: true,
      ...analytics
    });

  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analytics' 
      },
      { status: 500 }
    );
  }
}