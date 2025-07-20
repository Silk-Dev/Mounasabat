
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntentSucceeded.amount} was successful!`);
      // Update booking status in your database
      await prisma.booking.updateMany({
        where: { paymentIntentId: paymentIntentSucceeded.id },
        data: { paymentStatus: 'paid', status: 'confirmed' },
      });
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntentFailed.amount} failed.`);
      // Update booking status in your database
      await prisma.booking.updateMany({
        where: { paymentIntentId: paymentIntentFailed.id },
        data: { paymentStatus: 'failed' },
      });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
