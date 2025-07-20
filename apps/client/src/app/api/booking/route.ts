
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '@mounasabet/notifications';

const prisma = new PrismaClient();
const emailService = new EmailService();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { event: true },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { eventId, userId, providerId, startTime, endTime } = await req.json();

    if (!eventId || !userId || !providerId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newBooking = await prisma.booking.create({
      data: {
        eventId,
        userId,
        providerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    // Fetch user and event details for email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (user && event) {
      const subject = 'Booking Confirmation';
      const text = `Your booking for ${event.name} from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()} has been confirmed.`;
      const html = `<p>Your booking for <strong>${event.name}</strong> from <strong>${new Date(startTime).toLocaleString()}</strong> to <strong>${new Date(endTime).toLocaleString()}</strong> has been confirmed.</p>`;

      await emailService.sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });
    }

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking or sending email:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
