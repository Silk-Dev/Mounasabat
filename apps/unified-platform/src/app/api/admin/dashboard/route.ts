import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '../../../../lib/production-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and 30 days ago for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get platform metrics
    const [
      totalUsers,
      totalProviders,
      verifiedProviders,
      totalBookings,
      totalOrders,
      openIssues,
      recentUsers,
      recentProviders,
      recentBookings,
      recentOrders,
      issuesByPriority,
      usersByRole,
      bookingsByStatus,
      recentActivity,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.provider.count(),
      prisma.provider.count({ where: { isVerified: true } }),
      prisma.booking.count(),
      prisma.order.count(),
      prisma.issue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),

      // Recent counts (last 30 days)
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.provider.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Issue breakdown
      prisma.issue.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),

      // User role breakdown
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Booking status breakdown
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent activity (last 10 activities)
      Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
        prisma.booking.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
        }),
        prisma.issue.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reportedByUser: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]),
    ]);

    // Calculate growth percentages (simplified - would need historical data for accurate calculation)
    const userGrowth = recentUsers > 0 ? ((recentUsers / Math.max(totalUsers - recentUsers, 1)) * 100).toFixed(1) : '0';
    const providerGrowth = recentProviders > 0 ? ((recentProviders / Math.max(totalProviders - recentProviders, 1)) * 100).toFixed(1) : '0';
    const bookingGrowth = recentBookings > 0 ? ((recentBookings / Math.max(totalBookings - recentBookings, 1)) * 100).toFixed(1) : '0';

    // Format recent activity
    const [recentUserSignups, recentBookingActivity, recentIssueActivity] = recentActivity;
    
    const formattedActivity = [
      ...recentUserSignups.map(user => ({
        type: 'user_signup',
        message: `${user.name} signed up as ${user.role}`,
        timestamp: user.createdAt,
        userId: user.id,
      })),
      ...recentBookingActivity.map(booking => ({
        type: 'booking',
        message: `${booking.user.name} booked ${booking.service?.name || 'a service'}`,
        timestamp: booking.createdAt,
        bookingId: booking.id,
      })),
      ...recentIssueActivity.map(issue => ({
        type: 'issue',
        message: `${issue.reportedByUser?.name || 'Someone'} reported: ${issue.title}`,
        timestamp: issue.createdAt,
        issueId: issue.id,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    const metrics = {
      overview: {
        totalUsers: {
          value: totalUsers,
          growth: `+${userGrowth}%`,
          trend: 'up',
        },
        totalProviders: {
          value: totalProviders,
          growth: `+${providerGrowth}%`,
          trend: 'up',
        },
        verifiedProviders: {
          value: verifiedProviders,
          percentage: totalProviders > 0 ? ((verifiedProviders / totalProviders) * 100).toFixed(1) : '0',
        },
        totalBookings: {
          value: totalBookings,
          growth: `+${bookingGrowth}%`,
          trend: 'up',
        },
        totalOrders: {
          value: totalOrders,
        },
        openIssues: {
          value: openIssues,
          trend: openIssues > 10 ? 'warning' : 'normal',
        },
      },
      breakdowns: {
        issuesByPriority: issuesByPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {} as Record<string, number>),
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role || 'unknown'] = item._count.role;
          return acc;
        }, {} as Record<string, number>),
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
      },
      recentActivity: formattedActivity,
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}