import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { logger } from '@/lib/production-logger';
import { withApiMiddleware, withAuth } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';
import { validateRequiredFields } from '@/lib/api-response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const createIntentSchema = z.object({
  amount: z.number().int().min(50, 'Minimum amount is $0.50').max(10000000, 'Amount exceeds maximum limit'), // Minimum $0.50, max $100,000
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  customerInfo: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').trim(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').trim(),
    email: z.string().email('Invalid email format').max(255, 'Email too long').toLowerCase(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  }),
  eventDetails: z.object({
    type: z.string().min(1, 'Event type is required').max(100, 'Event type too long').trim(),
    date: z.string().datetime('Invalid date format'),
    guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(10000, 'Guest count exceeds maximum').optional(),
    location: z.string().max(200, 'Location too long').trim().optional(),
  }),
  services: z.array(z.object({
    serviceId: z.string().uuid('Invalid service ID format'),
    providerId: z.string().uuid('Invalid provider ID format'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity exceeds maximum'),
    price: z.number().min(0, 'Price cannot be negative').max(100000, 'Price exceeds maximum'),
  })).min(1, 'At least one service is required').max(20, 'Too many services'),
});

async function handlePOST(request: NextRequest) {
  const body = await request.json();
  
  // Validate required fields
  const requiredFields = ['amount', 'customerInfo', 'eventDetails', 'services'];
  const missingFields = validateRequiredFields(body, requiredFields);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate and sanitize data
  const validatedData = createIntentSchema.parse(body);
  const { amount, currency, customerInfo, eventDetails, services } = validatedData;

  // Validate event date is in the future
  const eventDate = new Date(eventDetails.date);
  if (eventDate <= new Date()) {
    throw new Error('Event date must be in the future');
  }

  // Validate that amount matches service prices
  const calculatedAmount = services.reduce((sum, service) => sum + (service.price * service.quantity), 0);
  if (Math.abs(calculatedAmount - amount) > 1) { // Allow 1 cent difference for rounding
    throw new Error('Amount does not match service prices');
  }

  // Create or retrieve customer
  let customer;
  try {
    const existingCustomers = await stripe.customers.list({
      email: customerInfo.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      
      // Update customer information if needed
      await stripe.customers.update(customer.id, {
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        phone: customerInfo.phone,
      });
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
  } catch (stripeError) {
    logger.error('Error creating/retrieving Stripe customer:', stripeError);
    throw new Error('Failed to process customer information');
  }

  // Create payment intent with enhanced metadata
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
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      customerEmail: customerInfo.email,
      services: JSON.stringify(services.map(s => ({
        id: s.serviceId,
        providerId: s.providerId,
        quantity: s.quantity,
        price: s.price,
      }))),
    },
    description: `Event booking: ${eventDetails.type} on ${new Date(eventDetails.date).toLocaleDateString()}`,
    receipt_email: customerInfo.email,
  });

  return ApiResponseBuilder.success({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    customerId: customer.id,
  }, 'Payment intent created successfully');
}

// Export wrapped handler with proper authentication and error handling
export const POST = withAuth(handlePOST, {
  component: 'payment_intent_api',
  roles: ['customer', 'admin'], // Only customers and admins can create payment intents
});