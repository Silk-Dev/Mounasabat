import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/production-logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const refundSchema = z.object({
  paymentIntentId: z.string(),
  amount: z.number().optional(), // If not provided, full refund
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).default('requested_by_customer'),
  bookingId: z.string().optional(),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = refundSchema.parse(body);

    const { paymentIntentId, amount, reason, bookingId, orderId } = validatedData;

    // Retrieve the payment intent to get the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.charges.data.length) {
      return NextResponse.json(
        { error: 'No charges found for this payment intent' },
        { status: 400 }
      );
    }

    const charge = paymentIntent.charges.data[0];

    // Create refund
    const refund = await stripe.refunds.create({
      charge: charge.id,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents or full refund
      reason,
      metadata: {
        bookingId: bookingId || '',
        orderId: orderId || '',
        refundedAt: new Date().toISOString(),
      },
    });

    // Update database records
    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.payment.updateMany({
        where: {
          stripePaymentId: paymentIntentId,
        },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date(),
        },
      });

      // Update booking if provided
      if (bookingId) {
        await tx.booking.update({
          where: {
            id: bookingId,
          },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            updatedAt: new Date(),
          },
        });
      }

      // Update order if provided
      if (orderId) {
        await tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            status: 'REFUNDED',
            updatedAt: new Date(),
          },
        });

        // Create order tracking entry
        await tx.orderTracking.create({
          data: {
            orderId,
            status: 'REFUNDED',
            description: `Refund processed: $${(refund.amount / 100).toFixed(2)}`,
            timestamp: new Date(),
          },
        });
      }

      // Create notification for user
      const booking = bookingId ? await tx.booking.findUnique({
        where: { id: bookingId },
        include: { user: true, event: true },
      }) : null;

      const order = orderId ? await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      }) : null;

      const userId = booking?.userId || order?.userId;
      
      if (userId) {
        await tx.notification.create({
          data: {
            userId,
            type: 'EMAIL',
            title: 'Refund Processed',
            message: `Your refund of $${(refund.amount / 100).toFixed(2)} has been processed and will appear in your account within 5-10 business days.`,
            data: {
              refundId: refund.id,
              amount: refund.amount / 100,
              bookingId: bookingId || null,
              orderId: orderId || null,
            },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason,
      },
    });

  } catch (error) {
    logger.error('Refund processing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve refund information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const refundId = searchParams.get('refundId');

    if (!paymentIntentId && !refundId) {
      return NextResponse.json(
        { error: 'Either paymentIntentId or refundId is required' },
        { status: 400 }
      );
    }

    let refunds: Stripe.Refund[] = [];

    if (refundId) {
      const refund = await stripe.refunds.retrieve(refundId);
      refunds = [refund];
    } else if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.charges.data.length > 0) {
        const charge = paymentIntent.charges.data[0];
        const refundList = await stripe.refunds.list({
          charge: charge.id,
        });
        refunds = refundList.data;
      }
    }

    const refundData = refunds.map(refund => ({
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      reason: refund.reason,
      created: new Date(refund.created * 1000),
      metadata: refund.metadata,
    }));

    return NextResponse.json({
      success: true,
      refunds: refundData,
    });

  } catch (error) {
    logger.error('Refund retrieval error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}