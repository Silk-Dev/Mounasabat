import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const createIntentSchema = z.object({
  amount: z.number().min(50), // Minimum $0.50
  currency: z.string().default('usd'),
  customerInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  eventDetails: z.object({
    type: z.string(),
    date: z.string(),
    guestCount: z.number().optional(),
    location: z.string().optional(),
  }),
  services: z.array(z.object({
    serviceId: z.string(),
    providerId: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createIntentSchema.parse(body);

    const { amount, currency, customerInfo, eventDetails, services } = validatedData;

    // Create or retrieve customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: customerInfo.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerInfo.email,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          phone: customerInfo.phone,
          metadata: {
            eventType: eventDetails.type,
            eventDate: eventDetails.date,
            guestCount: eventDetails.guestCount?.toString() || '',
            location: eventDetails.location || '',
          },
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        eventType: eventDetails.type,
        eventDate: eventDetails.date,
        serviceCount: services.length.toString(),
        guestCount: eventDetails.guestCount?.toString() || '',
        location: eventDetails.location || '',
        services: JSON.stringify(services.map(s => ({
          id: s.serviceId,
          providerId: s.providerId,
          quantity: s.quantity,
          price: s.price,
        }))),
      },
      description: `Event booking: ${eventDetails.type} on ${eventDetails.date}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);

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