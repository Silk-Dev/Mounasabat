import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/admin/reviews/[id] - Admin update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, reason, isVerified } = body;

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
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
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: `Review ${action || 'updated'} successfully`,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Admin delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason');

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
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

    // Log the deletion (in a real app, you might want to keep an audit trail)
    console.log(`Admin deleted review ${params.id}. Reason: ${reason || 'Not specified'}`);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
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