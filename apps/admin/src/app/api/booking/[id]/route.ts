
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '@mounasabet/notifications';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const emailService = new EmailService();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { status } = await req.json();

  try {
    const bookingToUpdate = await prisma.booking.findUnique({
      where: { id },
    });

    if (!bookingToUpdate) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let paymentStatus = bookingToUpdate.paymentStatus;

    if (status === 'delivered' && bookingToUpdate.paymentStatus !== 'paid' && bookingToUpdate.paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.capture(bookingToUpdate.paymentIntentId);
        if (paymentIntent.status === 'succeeded') {
          paymentStatus = 'paid';
        } else {
          paymentStatus = 'failed';
          console.error('Failed to capture payment for booking:', bookingToUpdate.id, paymentIntent.status);
        }
      } catch (stripeError) {
        console.error('Stripe capture error:', stripeError);
        paymentStatus = 'failed';
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status, paymentStatus },
      include: { user: true, event: true }, // Include user and event to send email
    });

    // Send email notification
    if (updatedBooking.user && updatedBooking.event) {
      const subject = `Your booking for ${updatedBooking.event.name} is now ${updatedBooking.status}`;
      const text = `Dear ${updatedBooking.user.name},
Your booking for ${updatedBooking.event.name} from ${updatedBooking.startTime.toLocaleString()} to ${updatedBooking.endTime.toLocaleString()} has been ${updatedBooking.status}.
Thank you.`;
      const html = `<p>Dear ${updatedBooking.user.name},</p>
<p>Your booking for <strong>${updatedBooking.event.name}</strong> from <strong>${updatedBooking.startTime.toLocaleString()}</strong> to <strong>${updatedBooking.endTime.toLocaleString()}</strong> has been <strong>${updatedBooking.status}</strong>.</p>
<p>Thank you.</p>`;

      await emailService.sendEmail({
        to: updatedBooking.user.email,
        subject,
        text,
        html,
      });
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking or sending email:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
