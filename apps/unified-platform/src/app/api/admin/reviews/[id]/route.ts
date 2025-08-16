import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';
import { logger } from '@/lib/production-logger';
import { getSession } from '@/lib/auth';
import { auditLogger, AuditEventType, AuditLogLevel } from '@/lib/audit-logger';
import { id } from 'date-fns/locale';

const prisma = new PrismaClient();

// PUT /api/admin/reviews/[id] - Admin update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        action: 'moderate_review',
        description: 'Unauthorized attempt to moderate review',
        success: false,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason, isVerified } = body;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    if (!review) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: id,
        targetResourceType: 'review',
        action: 'moderate_review',
        description: 'Attempted to moderate non-existent review',
        success: false,
      });
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'verify':
        updateData.isVerified = true;
        break;
      case 'unverify':
        updateData.isVerified = false;
        break;
      case 'flag':
        // In a real app, you might have a separate flagged reviews table
        // For now, we'll use a simple approach
        updateData.comment = `[FLAGGED: ${reason}] ${review.comment}`;
        break;
      case 'unflag':
        // Remove flag prefix if it exists
        if (review.comment?.startsWith('[FLAGGED:')) {
          const flagEndIndex = review.comment.indexOf('] ');
          if (flagEndIndex !== -1) {
            updateData.comment = review.comment.substring(flagEndIndex + 2);
          }
        }
        break;
      default:
        if (isVerified !== undefined) {
          updateData.isVerified = isVerified;
        }
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
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
    });

    // Log the review moderation action
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: review.userId,
      targetResourceId: review.id,
      targetResourceType: 'review',
      action: `${action || 'update'}_review`,
      description: `Admin ${action || 'updated'} review by ${review.user.name} for ${review.provider?.name || 'unknown provider'}${reason ? `. Reason: ${reason}` : ''}`,
      success: true,
      metadata: {
        action,
        reason,
        originalVerified: review.isVerified,
        newVerified: isVerified,
        reviewRating: review.rating,
        reviewComment: review.comment?.substring(0, 100) + (review.comment && review.comment.length > 100 ? '...' : ''),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: `Review ${action || 'updated'} successfully`,
    });
  } catch (error) {
    logger.error('Error updating review:', error);
    
    // Log the error
    const session = await getSession(request);
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session?.user?.id,
      userRole: 'admin',
      targetResourceId: id,
      targetResourceType: 'review',
      action: 'moderate_review',
      description: 'Failed to moderate review due to system error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Admin delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        action: 'delete_review',
        description: 'Unauthorized attempt to delete review',
        success: false,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    if (!review) {
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.WARNING,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole: 'admin',
        targetResourceId: id,
        targetResourceType: 'review',
        action: 'delete_review',
        description: 'Attempted to delete non-existent review',
        success: false,
      });
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: { id: params.id },
    });

    // Update provider rating
    if (review.providerId) {
      await updateProviderRating(review.providerId);
    }

    // Log the deletion with audit trail
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.INFO,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session.user.id,
      userRole: 'admin',
      targetUserId: review.userId,
      targetResourceId: review.id,
      targetResourceType: 'review',
      action: 'delete_review',
      description: `Admin deleted review by ${review.user.name} for ${review.provider?.name || 'unknown provider'}${reason ? `. Reason: ${reason}` : ''}`,
      success: true,
      metadata: {
        reason,
        deletedReview: {
          rating: review.rating,
          comment: review.comment?.substring(0, 100) + (review.comment && review.comment.length > 100 ? '...' : ''),
          isVerified: review.isVerified,
          createdAt: review.createdAt,
        },
        reviewerName: review.user.name,
        providerName: review.provider?.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting review:', error);
    
    // Log the error
    const session = await getSession(request);
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      userId: session?.user?.id,
      userRole: 'admin',
      targetResourceId: id,
      targetResourceType: 'review',
      action: 'delete_review',
      description: 'Failed to delete review due to system error',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
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