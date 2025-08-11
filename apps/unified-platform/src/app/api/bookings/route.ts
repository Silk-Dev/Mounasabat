import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@mounasabet/database';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { auditLogger, AuditEventType, AuditLogLevel, auditHelpers } from '@/lib/audit-logger';
import { bookingSchema } from '@/lib/validation';
import { InputSanitizer } from '@/lib/security';
import { DataEncryption } from '@/lib/encryption';

// Enhanced booking schema with security validations
const createBookingSchema = z.object({
  services: z.array(z.object({
    serviceId: z.string().uuid('Invalid service ID format'),
    providerId: z.string().uuid('Invalid provider ID format'),
    quantity: z.number().int().min(1).max(100),
    price: z.number().min(0).max(100000),
    duration: z.number().int().min(1).max(24 * 60), // Max 24 hours in minutes
    customizations: z.record(z.any()).optional(),
  })).min(1).max(10), // Max 10 services per booking
  eventDetails: z.object({
    type: z.string().min(1).max(100).transform(InputSanitizer.sanitizeGeneral),
    date: z.string().datetime().transform((str) => new Date(str)),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    guestCount: z.number().int().min(1).max(10000).optional(),
    location: z.string().max(200).transform(InputSanitizer.sanitizeGeneral).optional(),
    specialRequests: z.string().max(1000).transform(InputSanitizer.sanitizeGeneral).optional(),
  }),
  customerInfo: z.object({
    firstName: z.string().min(1).max(50).transform(InputSanitizer.sanitizeGeneral),
    lastName: z.string().min(1).max(50).transform(InputSanitizer.sanitizeGeneral),
    email: z.string().email().max(255).toLowerCase(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    address: z.object({
      street: z.string().min(1).max(200).transform(InputSanitizer.sanitizeGeneral),
      city: z.string().min(1).max(100).transform(InputSanitizer.sanitizeGeneral),
      state: z.string().min(1).max(100).transform(InputSanitizer.sanitizeGeneral),
      zipCode: z.string().min(3).max(20).regex(/^[A-Z0-9\s\-]{3,20}$/i, 'Invalid postal code'),
      country: z.string().min(2).max(100).transform(InputSanitizer.sanitizeGeneral),
    }).optional(),
  }),
  paymentInfo: z.object({
    method: z.enum(['card', 'bank_transfer']),
    status: z.enum(['pending', 'processing', 'succeeded', 'failed']),
    transactionId: z.string().max(255).optional(),
    amount: z.number().min(0).max(1000000), // Max $10,000
    currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  }),
  totalAmount: z.number().min(0).max(1000000),
}).refine(data => {
  // Validate that event date is in the future
  const eventDate = new Date(data.eventDetails.date);
  const now = new Date();
  return eventDate > now;
}, {
  message: "Event date must be in the future",
  path: ["eventDetails", "date"]
}).refine(data => {
  // Validate that start time is before end time
  const [startHours, startMinutes] = data.eventDetails.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.eventDetails.endTime.split(':').map(Number);
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;
  return startMinutesTotal < endMinutesTotal;
}, {
  message: "Start time must be before end time",
  path: ["eventDetails", "startTime"]
}).refine(data => {
  // Validate that payment amount matches total amount
  return Math.abs(data.paymentInfo.amount - data.totalAmount) < 0.01;
}, {
  message: "Payment amount must match total amount",
  path: ["paymentInfo", "amount"]
});

export async function POST(request: NextRequest) {
  try {
    return await withRateLimit(request, 'booking', async () => {
      // Check authentication
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          action: 'booking_creation_unauthorized',
          description: 'Unauthorized booking creation attempt',
          success: false,
        });

        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const body = await request.json();
      const validatedData = createBookingSchema.parse(body);

      const { services, eventDetails, customerInfo, paymentInfo, totalAmount } = validatedData;

      // Generate secure confirmation number
      const confirmationNumber = `BK${Date.now()}${DataEncryption.generateSecureToken(4).toUpperCase()}`;

      // Encrypt sensitive customer information
      const encryptedCustomerInfo = await DataEncryption.encryptPII({
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
      });

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
      // Create or find user
      let user = await tx.user.findUnique({
        where: { email: customerInfo.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            id: `user_${Date.now()}_${DataEncryption.generateSecureToken(9)}`,
            email: customerInfo.email,
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'customer',
          },
        });

        // Log new user creation
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.INFO,
          eventType: AuditEventType.USER_CREATED,
          userId: user.id,
          action: 'user_created_via_booking',
          description: `New user created during booking process: ${customerInfo.email}`,
          success: true,
          metadata: { email: customerInfo.email, source: 'booking' },
        });
      }

      // Create event first
      const event = await tx.event.create({
        data: {
          name: `${eventDetails.type} Event`,
          description: eventDetails.specialRequests || `${eventDetails.type} event for ${customerInfo.firstName} ${customerInfo.lastName}`,
          type: eventDetails.type,
          startDate: eventDetails.date,
          endDate: eventDetails.date,
        },
      });

      // Create bookings for each service
      const bookings = [];
      
      for (const service of services) {
        const startDateTime = new Date(eventDetails.date);
        const [startHours, startMinutes] = eventDetails.startTime.split(':').map(Number);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const endDateTime = new Date(eventDetails.date);
        const [endHours, endMinutes] = eventDetails.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        const booking = await tx.booking.create({
          data: {
            eventId: event.id,
            userId: user.id,
            providerId: service.providerId,
            serviceId: service.serviceId,
            startTime: startDateTime,
            endTime: endDateTime,
            status: paymentInfo.status === 'succeeded' ? 'CONFIRMED' : 'PENDING',
            paymentStatus: paymentInfo.status === 'succeeded' ? 'PAID' : 'UNPAID',
          },
          include: {
            service: true,
          },
        });

        bookings.push(booking);
      }

      // Create order for payment tracking
      const order = await tx.order.create({
        data: {
          userId: user.id,
          orderType: 'BOOKING',
          status: paymentInfo.status === 'succeeded' ? 'CONFIRMED' : 'PENDING',
          totalAmount: totalAmount,
          eventId: event.id,
        },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: paymentInfo.currency,
          status: paymentInfo.status === 'succeeded' ? 'PAID' : 'UNPAID',
          paymentMethod: paymentInfo.method,
          stripePaymentId: paymentInfo.transactionId,
        },
      });

        return { bookings, payment, user };
      });

      // Log successful booking creation
      await auditHelpers.logBookingCreation(
        session.user.id,
        result.bookings[0].id,
        services[0].serviceId,
        totalAmount,
        request
      );

      // Send confirmation email (in a real app, this would be queued)
      try {
        await sendBookingConfirmationEmail({
          customerEmail: customerInfo.email,
          customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          confirmationNumber,
          bookings: result.bookings,
          eventDetails,
          totalAmount,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        
        // Log email failure but don't fail the booking
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.BOOKING_CREATED,
          userId: session.user.id,
          targetResourceId: result.bookings[0].id,
          action: 'booking_email_failed',
          description: 'Booking created but confirmation email failed',
          success: false,
          errorMessage: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: result.bookings[0].id, // Return first booking ID as primary
          confirmationNumber,
          status: result.bookings[0].status,
        },
        confirmationNumber,
        message: 'Booking created successfully',
      });
    });

  } catch (error) {
    console.error('Booking creation error:', error);

    // Log the error
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.BOOKING_CREATED,
      action: 'booking_creation_failed',
      description: 'Booking creation failed',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many booking attempts. Please try again later.',
        },
        { status: 429 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create booking',
        message: 'An unexpected error occurred. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}

// Helper function to send confirmation email
async function sendBookingConfirmationEmail({
  customerEmail,
  customerName,
  confirmationNumber,
  bookings,
  eventDetails,
  totalAmount,
}: {
  customerEmail: string;
  customerName: string;
  confirmationNumber: string;
  bookings: any[];
  eventDetails: any;
  totalAmount: number;
}) {
  // In a real application, this would integrate with an email service
  // like SendGrid, AWS SES, or similar
  console.log('Sending confirmation email to:', customerEmail);
  console.log('Confirmation details:', {
    confirmationNumber,
    eventType: eventDetails.type,
    eventDate: eventDetails.date,
    serviceCount: bookings.length,
    totalAmount,
  });

  // Mock email sending - replace with actual email service
  return Promise.resolve();
}

export async function GET(request: NextRequest) {
  try {
    return await withRateLimit(request, 'api', async () => {
      // Check authentication
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        await auditLogger.logFromRequest(request, {
          level: AuditLogLevel.WARNING,
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          action: 'booking_list_unauthorized',
          description: 'Unauthorized booking list access attempt',
          success: false,
        });

        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const status = searchParams.get('status');
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 items
      const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

      const where: any = {};
      const userRole = (session.user as any).role;
      
      // Security: Users can only see their own bookings unless they're admin/provider
      if (userRole === 'customer') {
        where.userId = session.user.id;
      } else if (userRole === 'provider') {
        where.providerId = session.user.id;
      } else if (userRole === 'admin' && userId) {
        // Admins can filter by userId
        where.userId = userId;
      }
      
      // Validate and sanitize status filter
      if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        where.status = status;
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          service: true,
          user: {
            select: {
              id: true,
              name: true,
              email: userRole === 'admin', // Only admins can see email addresses
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.booking.count({ where });

      // Log the booking list access
      await auditLogger.logFromRequest(request, {
        level: AuditLogLevel.INFO,
        eventType: AuditEventType.ADMIN_ACTION,
        userId: session.user.id,
        userRole,
        action: 'view_bookings',
        description: `User viewed bookings list (${bookings.length} results)`,
        success: true,
        metadata: { 
          filters: { userId, status }, 
          resultCount: bookings.length,
          pagination: { limit, offset }
        },
      });

      return NextResponse.json({
        success: true,
        bookings,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);

    // Log the error
    await auditLogger.logFromRequest(request, {
      level: AuditLogLevel.ERROR,
      eventType: AuditEventType.ADMIN_ACTION,
      action: 'fetch_bookings_failed',
      description: 'Failed to fetch bookings',
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bookings' 
      },
      { status: 500 }
    );
  }
}