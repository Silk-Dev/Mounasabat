import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface BookingEmailData {
  customerName: string;
  providerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  bookingId: string;
}

interface NotificationEmailData {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Booking confirmation email
  async sendBookingConfirmation(to: string, data: BookingEmailData) {
    const subject = `Booking Confirmation - ${data.serviceName}`;
    const html = this.generateBookingConfirmationHTML(data);
    const text = this.generateBookingConfirmationText(data);

    await this.sendEmail({ to, subject, text, html });
  }

  // Booking update email
  async sendBookingUpdate(to: string, data: BookingEmailData & { status: string; updateMessage: string }) {
    const subject = `Booking Update - ${data.serviceName}`;
    const html = this.generateBookingUpdateHTML(data);
    const text = this.generateBookingUpdateText(data);

    await this.sendEmail({ to, subject, text, html });
  }

  // General notification email
  async sendNotificationEmail(to: string, data: NotificationEmailData) {
    const subject = data.title;
    const html = this.generateNotificationHTML(data);
    const text = this.generateNotificationText(data);

    await this.sendEmail({ to, subject, text, html });
  }

  private generateBookingConfirmationHTML(data: BookingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>Your booking has been confirmed. Here are the details:</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <strong>Service:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Provider:</strong>
                  <span>${data.providerName}</span>
                </div>
                <div class="detail-row">
                  <strong>Date:</strong>
                  <span>${data.bookingDate}</span>
                </div>
                <div class="detail-row">
                  <strong>Time:</strong>
                  <span>${data.bookingTime}</span>
                </div>
                <div class="detail-row">
                  <strong>Total Amount:</strong>
                  <span>$${data.totalAmount}</span>
                </div>
                <div class="detail-row">
                  <strong>Booking ID:</strong>
                  <span>${data.bookingId}</span>
                </div>
              </div>
              
              <p>We'll send you a reminder closer to your event date.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing Mounasabet!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateBookingConfirmationText(data: BookingEmailData): string {
    return `
Booking Confirmed!

Dear ${data.customerName},

Your booking has been confirmed. Here are the details:

Service: ${data.serviceName}
Provider: ${data.providerName}
Date: ${data.bookingDate}
Time: ${data.bookingTime}
Total Amount: $${data.totalAmount}
Booking ID: ${data.bookingId}

We'll send you a reminder closer to your event date.
If you have any questions, please don't hesitate to contact us.

Thank you for choosing Mounasabet!
    `;
  }

  private generateBookingUpdateHTML(data: BookingEmailData & { status: string; updateMessage: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .status { padding: 8px 16px; border-radius: 4px; font-weight: bold; }
            .status.confirmed { background: #dcfce7; color: #166534; }
            .status.cancelled { background: #fef2f2; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Update</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>There's an update to your booking:</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <strong>Status:</strong>
                  <span class="status ${data.status.toLowerCase()}">${data.status}</span>
                </div>
                <div class="detail-row">
                  <strong>Service:</strong>
                  <span>${data.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Provider:</strong>
                  <span>${data.providerName}</span>
                </div>
                <div class="detail-row">
                  <strong>Booking ID:</strong>
                  <span>${data.bookingId}</span>
                </div>
              </div>
              
              <p><strong>Update:</strong> ${data.updateMessage}</p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing Mounasabet!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateBookingUpdateText(data: BookingEmailData & { status: string; updateMessage: string }): string {
    return `
Booking Update

Dear ${data.customerName},

There's an update to your booking:

Status: ${data.status}
Service: ${data.serviceName}
Provider: ${data.providerName}
Booking ID: ${data.bookingId}

Update: ${data.updateMessage}

If you have any questions, please don't hesitate to contact us.

Thank you for choosing Mounasabet!
    `;
  }

  private generateNotificationHTML(data: NotificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <p>Dear ${data.userName},</p>
              <p>${data.message}</p>
              ${data.actionUrl && data.actionText ? `
                <div style="text-align: center;">
                  <a href="${data.actionUrl}" class="button">${data.actionText}</a>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>Thank you for using Mounasabet!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateNotificationText(data: NotificationEmailData): string {
    return `
${data.title}

Dear ${data.userName},

${data.message}

${data.actionUrl && data.actionText ? `
${data.actionText}: ${data.actionUrl}
` : ''}

Thank you for using Mounasabet!
    `;
  }
}