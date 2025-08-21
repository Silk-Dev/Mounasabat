import { prisma } from '@/lib/prisma';
import { EmailService } from './email-service';
import { NotificationType } from '@/generated/client';
import { logger } from './production-logger';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
}

export interface NotificationPreferences {
  emailBookingConfirmations: boolean;
  emailBookingUpdates: boolean;
  emailPromotions: boolean;
  emailReminders: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Create a new notification
  async createNotification(data: CreateNotificationData) {
    try {
      // Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
        },
      });

      // Send email if requested and user preferences allow it
      if (data.sendEmail) {
        await this.sendEmailNotification(data.userId, data.title, data.message, data.data);
      }

      // Trigger real-time notification (we'll implement this later)
      await this.triggerRealTimeNotification(data.userId, notification);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Send booking confirmation notification
  async sendBookingConfirmation(bookingId: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          service: {
            include: {
              provider: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!booking || !booking.service) {
        throw new Error('Booking or service not found');
      }

      const bookingData = {
        customerName: booking.user.name,
        providerName: booking.service.provider.user.name,
        serviceName: booking.service.name,
        bookingDate: booking.startTime.toLocaleDateString(),
        bookingTime: booking.startTime.toLocaleTimeString(),
        totalAmount: booking.service.basePrice || 0,
        bookingId: booking.id,
      };

      // Send email to customer
      await this.emailService.sendBookingConfirmation(booking.user.email, bookingData);

      // Create in-app notification for customer
      await this.createNotification({
        userId: booking.userId,
        type: NotificationType.EMAIL,
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.service.name} has been confirmed for ${bookingData.bookingDate} at ${bookingData.bookingTime}.`,
        data: { bookingId: booking.id, type: 'booking_confirmation' },
      });

      // Notify provider
      await this.createNotification({
        userId: booking.service.provider.userId,
        type: NotificationType.IN_APP,
        title: 'New Booking Received',
        message: `You have a new booking from ${booking.user.name} for ${booking.service.name}.`,
        data: { bookingId: booking.id, type: 'new_booking' },
        sendEmail: true,
      });

    } catch (error) {
      logger.error('Error sending booking confirmation:', error);
      throw new Error('Failed to send booking confirmation');
    }
  }

  // Send booking update notification
  async sendBookingUpdate(bookingId: string, status: string, updateMessage: string) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          service: {
            include: {
              provider: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!booking || !booking.service) {
        throw new Error('Booking or service not found');
      }

      const bookingData = {
        customerName: booking.user.name,
        providerName: booking.service.provider.user.name,
        serviceName: booking.service.name,
        bookingDate: booking.startTime.toLocaleDateString(),
        bookingTime: booking.startTime.toLocaleTimeString(),
        totalAmount: booking.service.basePrice || 0,
        bookingId: booking.id,
        status,
        updateMessage,
      };

      // Send email to customer
      await this.emailService.sendBookingUpdate(booking.user.email, bookingData);

      // Create in-app notification
      await this.createNotification({
        userId: booking.userId,
        type: NotificationType.EMAIL,
        title: 'Booking Update',
        message: updateMessage,
        data: { bookingId: booking.id, status, type: 'booking_update' },
      });

    } catch (error) {
      logger.error('Error sending booking update:', error);
      throw new Error('Failed to send booking update');
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.notification.count({
        where: { userId },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        notifications,
        total,
        unreadCount,
        hasMore: total > page * limit,
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    try {
      await prisma.notification.deleteMany({
        where: { id: notificationId, userId },
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      const preferences = user?.preferences as any || {};
      
      return {
        emailBookingConfirmations: preferences.emailBookingConfirmations ?? true,
        emailBookingUpdates: preferences.emailBookingUpdates ?? true,
        emailPromotions: preferences.emailPromotions ?? false,
        emailReminders: preferences.emailReminders ?? true,
        inAppNotifications: preferences.inAppNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? false,
      };
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw new Error('Failed to get user preferences');
    }
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      const currentPreferences = (currentUser?.preferences as any) || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };

      await prisma.user.update({
        where: { id: userId },
        data: { preferences: updatedPreferences },
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  // Private method to send email notification
  private async sendEmailNotification(userId: string, title: string, message: string, data?: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const preferences = await this.getUserPreferences(userId);
      
      // Check if user wants email notifications
      if (!preferences.inAppNotifications) {
        return;
      }

      await this.emailService.sendNotificationEmail(user.email, {
        userName: user.name,
        title,
        message,
        actionUrl: data?.actionUrl,
        actionText: data?.actionText,
      });
    } catch (error) {
      logger.error('Error sending email notification:', error);
      // Don't throw error here to avoid breaking the main notification flow
    }
  }

  // Private method to trigger real-time notification
  private async triggerRealTimeNotification(userId: string, notification: any) {
    // This will be implemented when we add WebSocket support
    // For now, we'll just log it
    logger.info(`Real-time notification for user ${userId}:`, notification);
  }

  // Send reminder notifications
  async sendReminders() {
    try {
      // Get bookings that are 24 hours away
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          startTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          status: 'CONFIRMED',
        },
        include: {
          user: true,
          service: {
            include: {
              provider: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      for (const booking of upcomingBookings) {
        if (!booking.service) continue;

        await this.createNotification({
          userId: booking.userId,
          type: NotificationType.EMAIL,
          title: 'Booking Reminder',
          message: `Don't forget about your upcoming booking for ${booking.service.name} tomorrow at ${booking.startTime.toLocaleTimeString()}.`,
          data: { bookingId: booking.id, type: 'reminder' },
          sendEmail: true,
        });
      }
    } catch (error) {
      logger.error('Error sending reminders:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();