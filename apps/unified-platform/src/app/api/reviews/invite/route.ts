import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

// POST /api/reviews/invite - Send review invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, providerId, serviceId } = body;

    // Validate required fields
    if (!bookingId || !userId || !providerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify booking exists and is completed
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
        status: 'DELIVERED',
      },
      include: {
        user: true,
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or not completed' },
        { status: 404 }
      );
    }

    // Check if user has already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        providerId,
        ...(serviceId && { serviceId }),
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review already exists' },
        { status: 409 }
      );
    }

    // Create notification for review invitation
    await prisma.notification.create({
      data: {
        userId,
        type: 'EMAIL',
        title: 'Leave a Review',
        message: `How was your experience with ${booking.service?.provider.name}? Share your feedback to help other customers.`,
        data: {
          type: 'review_invitation',
          bookingId,
          providerId,
          serviceId,
          providerName: booking.service?.provider.name,
          serviceName: booking.service?.name,
        },
      },
    });

    // In a real application, you would send an email here
    // For now, we'll just create the notification
    
    return NextResponse.json({
      success: true,
      message: 'Review invitation sent successfully',
    });
  } catch (error) {
    logger.error('Error sending review invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send review invitation' },
      { status: 500 }
    );
  }
}

// GET /api/reviews/invite - Get pending review invitations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get completed bookings without reviews
    const pendingReviews = await prisma.booking.findMany({
      where: {
        userId,
        status: 'DELIVERED',
        // Only bookings where user hasn't left a review yet
        NOT: {
          service: {
            reviews: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: pendingReviews,
    });
  } catch (error) {
    logger.error('Error fetching pending reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}