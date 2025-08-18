import { PrismaClient } from '@/generated/client';
import { logger } from './production-logger';

const prisma = new PrismaClient();

export interface ReviewInvitationData {
  bookingId: string;
  userId: string;
  providerId: string;
  serviceId?: string;
  userEmail: string;
  userName: string;
  providerName: string;
  serviceName?: string;
  eventDate?: Date;
}

/**
 * Send review invitation after booking completion
 */
export async function sendReviewInvitation(data: ReviewInvitationData) {
  try {
    // Check if user has already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: data.userId,
        providerId: data.providerId,
        ...(data.serviceId && { serviceId: data.serviceId }),
      },
    });

    if (existingReview) {
      return { success: false, error: 'Review already exists' };
    }

    // Create notification for review invitation
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: 'EMAIL',
        title: 'Leave a Review',
        message: `How was your experience with ${data.providerName}? Share your feedback to help other customers.`,
        data: {
          type: 'review_invitation',
          bookingId: data.bookingId,
          providerId: data.providerId,
          serviceId: data.serviceId,
          providerName: data.providerName,
          serviceName: data.serviceName,
          eventDate: data.eventDate,
        },
      },
    });

    // In a real application, send email here
    await sendReviewInvitationEmail(data);

    return { success: true, message: 'Review invitation sent successfully' };
  } catch (error) {
    logger.error('Error sending review invitation:', error);
    return { success: false, error: 'Failed to send review invitation' };
  }
}

/**
 * Send review invitations for all completed bookings without reviews
 */
export async function sendBulkReviewInvitations() {
  try {
    // Get completed bookings without reviews from the last 30 days
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        // Only bookings where user hasn't left a review yet
        NOT: {
          service: {
            reviews: {
              some: {
                userId: {
                  equals: prisma.booking.fields.userId,
                },
              },
            },
          },
        },
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

    const invitations = [];

    for (const booking of completedBookings) {
      if (booking.service?.provider) {
        const invitationData: ReviewInvitationData = {
          bookingId: booking.id,
          userId: booking.userId,
          providerId: booking.service.provider.id,
          serviceId: booking.serviceId || undefined,
          userEmail: booking.user.email,
          userName: booking.user.name,
          providerName: booking.service.provider.name,
          serviceName: booking.service.name,
          eventDate: booking.startTime,
        };

        const result = await sendReviewInvitation(invitationData);
        invitations.push({ bookingId: booking.id, ...result });
      }
    }

    return {
      success: true,
      message: `Sent ${invitations.filter(i => i.success).length} review invitations`,
      details: invitations,
    };
  } catch (error) {
    logger.error('Error sending bulk review invitations:', error);
    return { success: false, error: 'Failed to send bulk review invitations' };
  }
}

/**
 * Get pending review invitations for a user
 */
export async function getPendingReviewInvitations(userId: string) {
  try {
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
      take: 10, // Limit to recent bookings
    });

    return { success: true, data: pendingReviews };
  } catch (error) {
    logger.error('Error fetching pending review invitations:', error);
    return { success: false, error: 'Failed to fetch pending reviews' };
  }
}

/**
 * Mock email sending function - replace with actual email service
 */
async function sendReviewInvitationEmail(data: ReviewInvitationData) {
  // In a real application, you would integrate with an email service like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Resend
  
  const emailContent = {
    to: data.userEmail,
    subject: `How was your experience with ${data.providerName}?`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${data.userName},</h2>
        
        <p>We hope you had a great experience with <strong>${data.providerName}</strong>!</p>
        
        ${data.serviceName ? `<p>Service: <strong>${data.serviceName}</strong></p>` : ''}
        
        <p>Your feedback is valuable to us and helps other customers make informed decisions. 
        Would you mind taking a moment to share your experience?</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/reviews/write?booking=${data.bookingId}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Write a Review
          </a>
        </div>
        
        <p>Thank you for choosing our platform!</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          If you don't want to receive review invitations, you can 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">unsubscribe here</a>.
        </p>
      </div>
    `,
  };

  // Mock email sending - replace with actual implementation
  logger.info('Sending review invitation email:', emailContent);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true };
}

/**
 * Schedule automatic review invitations
 * This would typically be called by a cron job or scheduled task
 */
export async function scheduleReviewInvitations() {
  // Send invitations 24 hours after booking completion
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentlyCompletedBookings = await prisma.booking.findMany({
    where: {
      status: 'DELIVERED',
      updatedAt: {
        gte: oneDayAgo,
        lte: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23-24 hours ago
      },
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

  for (const booking of recentlyCompletedBookings) {
    if (booking.service?.provider) {
      await sendReviewInvitation({
        bookingId: booking.id,
        userId: booking.userId,
        providerId: booking.service.provider.id,
        serviceId: booking.serviceId || undefined,
        userEmail: booking.user.email,
        userName: booking.user.name,
        providerName: booking.service.provider.name,
        serviceName: booking.service.name,
        eventDate: booking.startTime,
      });
    }
  }
}