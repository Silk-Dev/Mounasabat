import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription events if needed in the future
        console.log(`Subscription event: ${event.type}`);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: 'PAID',
        updatedAt: new Date(),
      },
    });

    // Update related booking status
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        user: true,
        event: true,
      },
    });

    if (booking) {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          updatedAt: new Date(),
        },
      });

      // Update related order status
      await prisma.order.updateMany({
        where: {
          eventId: booking.eventId,
          userId: booking.userId,
        },
        data: {
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });

      // Create order tracking entry
      const order = await prisma.order.findFirst({
        where: {
          eventId: booking.eventId,
          userId: booking.userId,
        },
      });

      if (order) {
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: 'PAYMENT_CONFIRMED',
            description: 'Payment successfully processed',
            timestamp: new Date(),
          },
        });
      }

      // Send confirmation notification
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: 'EMAIL',
          title: 'Booking Confirmed',
          message: `Your booking for ${booking.event.name} has been confirmed. Payment of $${(paymentIntent.amount / 100).toFixed(2)} was successfully processed.`,
          data: {
            bookingId: booking.id,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
          },
        },
      });
    }

    console.log('Payment success handling completed');
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
        updatedAt: new Date(),
      },
    });

    // Update related booking status
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        user: true,
        event: true,
      },
    });

    if (booking) {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });

      // Update related order status
      await prisma.order.updateMany({
        where: {
          eventId: booking.eventId,
          userId: booking.userId,
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Create order tracking entry
      const order = await prisma.order.findFirst({
        where: {
          eventId: booking.eventId,
          userId: booking.userId,
        },
      });

      if (order) {
        await prisma.orderTracking.create({
          data: {
            orderId: order.id,
            status: 'PAYMENT_FAILED',
            description: 'Payment processing failed',
            timestamp: new Date(),
          },
        });
      }

      // Send failure notification
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: 'EMAIL',
          title: 'Payment Failed',
          message: `Payment for your booking of ${booking.event.name} could not be processed. Please try again or contact support.`,
          data: {
            bookingId: booking.id,
            paymentIntentId: paymentIntent.id,
            lastPaymentError: paymentIntent.last_payment_error?.message,
          },
        },
      });
    }

    console.log('Payment failure handling completed');
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    // Update payment record
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
        updatedAt: new Date(),
      },
    });

    // Update related booking status
    const booking = await prisma.booking.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
    });

    if (booking) {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });

      // Update related order status
      await prisma.order.updateMany({
        where: {
          eventId: booking.eventId,
          userId: booking.userId,
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });
    }

    console.log('Payment cancellation handling completed');
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    throw error;
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    console.log('Charge dispute created:', dispute.id);

    // Create an issue for the dispute
    await prisma.issue.create({
      data: {
        title: `Payment Dispute: ${dispute.id}`,
        description: `A payment dispute has been created for charge ${dispute.charge}. Reason: ${dispute.reason}. Amount: $${(dispute.amount / 100).toFixed(2)}`,
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    console.log('Dispute handling completed');
  } catch (error) {
    console.error('Error handling dispute:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Invoice payment succeeded:', invoice.id);
    
    // Handle subscription or recurring payment logic here if needed
    // For now, just log the event
    
    console.log('Invoice payment success handling completed');
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
    throw error;
  }
}