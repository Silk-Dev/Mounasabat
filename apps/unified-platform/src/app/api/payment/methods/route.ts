import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/production-logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const addPaymentMethodSchema = z.object({
  userId: z.string(),
  paymentMethodId: z.string(), // Stripe payment method ID
  setAsDefault: z.boolean().default(false),
});

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  nickname: z.string().optional(),
});

// Get user's payment methods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user to find their Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({
        success: true,
        paymentMethods: [],
      });
    }

    const customer = customers.data[0];

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    // Format payment methods for response
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        funding: pm.card.funding,
        country: pm.card.country,
      } : null,
      billingDetails: pm.billing_details,
      created: new Date(pm.created * 1000),
      isDefault: customer.invoice_settings?.default_payment_method === pm.id,
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods,
    });

  } catch (error) {
    logger.error('Payment methods retrieval error:', error);

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

// Add new payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addPaymentMethodSchema.parse(body);

    const { userId, paymentMethodId, setAsDefault } = validatedData;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find or create Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Get the attached payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    const formattedMethod = {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        funding: paymentMethod.card.funding,
        country: paymentMethod.card.country,
      } : null,
      billingDetails: paymentMethod.billing_details,
      created: new Date(paymentMethod.created * 1000),
      isDefault: setAsDefault,
    };

    return NextResponse.json({
      success: true,
      paymentMethod: formattedMethod,
      message: 'Payment method added successfully',
    });

  } catch (error) {
    logger.error('Payment method addition error:', error);

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