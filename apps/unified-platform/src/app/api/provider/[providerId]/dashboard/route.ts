import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { logger } from '../../../../../lib/production-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const { providerId } = params;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Get current month metrics
    const [
      totalBookings,
      totalRevenue,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      reviews,
      lastMonthBookings,
      lastMonthRevenue
    ] = await Promise.all([
      // Total bookings this month
      prisma.booking.count({
        where: {
          providerId,
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      }),

      // Total revenue this month
      prisma.booking.aggregate({
        where: {
          providerId,
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          },
          status: 'completed'
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Pending bookings
      prisma.booking.count({
        where: {
          providerId,
          status: 'pending'
        }
      }),

      // Completed bookings this month
      prisma.booking.count({
        where: {
          providerId,
          status: 'completed',
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      }),

      // Cancelled bookings this month
      prisma.booking.count({
        where: {
          providerId,
          status: 'cancelled',
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      }),

      // Reviews
      prisma.review.findMany({
        where: {
          providerId
        },
        select: {
          rating: true
        }
      }),

      // Last month bookings for comparison
      prisma.booking.count({
        where: {
          providerId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      }),

      // Last month revenue for comparison
      prisma.booking.aggregate({
        where: {
          providerId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          },
          status: 'completed'
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Calculate metrics
    const revenue = totalRevenue._sum.totalAmount || 0;
    const lastMonthRevenueAmount = lastMonthRevenue._sum.totalAmount || 0;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Calculate growth percentages
    const monthlyGrowth = lastMonthBookings > 0 
      ? ((totalBookings - lastMonthBookings) / lastMonthBookings) * 100 
      : 0;
    const revenueGrowth = lastMonthRevenueAmount > 0 
      ? ((revenue - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100 
      : 0;

    // Get active customers (unique customers who booked this month)
    const activeCustomers = await prisma.booking.findMany({
      where: {
        providerId,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        providerId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        bookingServices: {
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const metrics = {
      totalBookings,
      totalRevenue: revenue,
      averageRating,
      activeCustomers: activeCustomers.length,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      monthlyGrowth,
      revenueGrowth,
      lastUpdated: new Date()
    };

    const formattedRecentBookings = recentBookings.map(booking => ({
      id: booking.id,
      customerName: booking.user.name || booking.user.email,
      serviceName: booking.bookingServices[0]?.service.name || 'Service',
      amount: booking.totalAmount,
      status: booking.status,
      date: booking.startTime
    }));

    return NextResponse.json({
      metrics,
      recentBookings: formattedRecentBookings
    });
  } catch (error) {
    logger.error('Error fetching provider dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}