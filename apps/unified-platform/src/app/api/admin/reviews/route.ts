import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/database/prisma";
import { logger } from '@/lib/production-logger';
import { getSession } from '@/lib/auth';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';


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
    logger.error('Error fetching reviews for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reviews - Bulk actions on reviews
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.unauthorized_access,
        userId: session?.user?.id,
        action: 'bulk_moderate_reviews',
        description: 'Unauthorized attempt to perform bulk review actions',
        success: false,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reviewIds, reason } = body;

    if (!action || !reviewIds || !Array.isArray(reviewIds)) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.admin_action,
        userId: session.user.id,
        userRole: 'admin',
        action: 'bulk_moderate_reviews',
        description: 'Invalid bulk review action request',
        success: false,
        metadata: { action, reviewIds, reason },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get review details before performing actions for audit logging
    const reviewsToProcess = await prisma.review.findMany({
      where: { id: { in: reviewIds } },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    let result;
    switch (action) {
      case 'delete':
        result = await prisma.review.deleteMany({
          where: { id: { in: reviewIds } },
        });

        // Update provider ratings
        const providerIds = [...new Set(reviewsToProcess.map(r => r.providerId).filter(Boolean))];
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
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.admin_action,
          userId: session.user.id,
          userRole: 'admin',
          action: 'bulk_moderate_reviews',
          description: `Invalid bulk review action: ${action}`,
          success: false,
          metadata: { action, reviewIds, reason },
        });
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Log the bulk action
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.admin_action,
      userId: session.user.id,
      userRole: 'admin',
      action: `bulk_${action}_reviews`,
      description: `Admin performed bulk ${action} on ${result.count} review(s)${reason ? `. Reason: ${reason}` : ''}`,
      success: true,
      metadata: {
        action,
        reason,
        reviewCount: result.count,
        reviewIds,
        affectedReviews: reviewsToProcess.map(r => ({
          id: r.id,
          rating: r.rating,
          reviewerName: r.user.name,
          providerName: r.provider?.name,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully ${action}d ${result.count} review(s)`,
    });
  } catch (error) {
    logger.error('Error performing bulk action on reviews:', error);
    
    // Log the error
    const session = await getSession(request);
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.admin_action,
      userId: session?.user?.id,
      userRole: 'admin',
      action: 'bulk_moderate_reviews',
      description: 'Failed to perform bulk review action due to system error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

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