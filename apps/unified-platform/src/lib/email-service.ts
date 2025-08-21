import { logger } from './production-logger';

export interface BookingData {
  customerName: string;
  providerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
  status?: string;
  updateMessage?: string;
}

export interface NotificationEmailData {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export class EmailService {
  constructor() {
    // Initialize email service (we'll use console logging for now)
  }

  async sendBookingConfirmation(email: string, data: BookingData) {
    try {
      // For now, we'll just log the email content
      // In production, you'd integrate with an email service like SendGrid, AWS SES, etc.
      logger.info('Sending booking confirmation email:', {
        to: email,
        subject: 'Booking Confirmation',
        data,
      });

      // Simulate email sending
      console.log(`📧 Booking confirmation email sent to ${email}`);
      console.log(`Subject: Booking Confirmation - ${data.serviceName}`);
      console.log(`Booking ID: ${data.bookingId}`);
      console.log(`Date: ${data.bookingDate} at ${data.bookingTime}`);
      console.log(`Provider: ${data.providerName}`);
      console.log(`Total: $${data.totalAmount}`);

      return { success: true };
    } catch (error) {
      logger.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  async sendBookingUpdate(email: string, data: BookingData) {
    try {
      logger.info('Sending booking update email:', {
        to: email,
        subject: 'Booking Update',
        data,
      });

      console.log(`📧 Booking update email sent to ${email}`);
      console.log(`Subject: Booking Update - ${data.serviceName}`);
      console.log(`Status: ${data.status}`);
      console.log(`Message: ${data.updateMessage}`);

      return { success: true };
    } catch (error) {
      logger.error('Error sending booking update email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(email: string, data: NotificationEmailData) {
    try {
      logger.info('Sending notification email:', {
        to: email,
        subject: data.title,
        data,
      });

      console.log(`📧 Notification email sent to ${email}`);
      console.log(`Subject: ${data.title}`);
      console.log(`Message: ${data.message}`);
      if (data.actionUrl) {
        console.log(`Action: ${data.actionText} - ${data.actionUrl}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error sending notification email:', error);
      throw error;
    }
  }
}