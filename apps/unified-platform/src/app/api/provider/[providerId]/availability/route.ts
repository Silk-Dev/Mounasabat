import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { logger } from '@/lib/production-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const { providerId } = params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const startDate = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
    const endDate = searchParams.get('endDate') || format(addDays(new Date(), 30), 'yyyy-MM-dd');

    // Get provider's availability slots
    const availabilitySlots = await prisma.availabilitySlot.findMany({
      where: {
        providerId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(serviceId && { serviceId })
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Get existing bookings to check availability
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        startTime: {
          gte: startOfDay(new Date(startDate)),
          lte: endOfDay(new Date(endDate))
        },
        status: {
          in: ['pending', 'confirmed']
        },
        ...(serviceId && {
          bookingServices: {
            some: { serviceId }
          }
        })
      },
      select: {
        id: true,
        startTime: true,
        endTime: true
      }
    });

    // Build availability data structure
    const availability: { [date: string]: Array<{ time: string; available: boolean; bookingId?: string }> } = {};

    availabilitySlots.forEach(slot => {
      const dateStr = format(slot.date, 'yyyy-MM-dd');
      const timeStr = slot.startTime;
      
      if (!availability[dateStr]) {
        availability[dateStr] = [];
      }

      // Check if this slot is booked
      const isBooked = bookings.some(booking => {
        const bookingStart = format(booking.startTime, 'HH:mm');
        const bookingEnd = format(booking.endTime, 'HH:mm');
        return format(booking.startTime, 'yyyy-MM-dd') === dateStr &&
               timeStr >= bookingStart && timeStr < bookingEnd;
      });

      const bookedSlot = bookings.find(booking => {
        const bookingStart = format(booking.startTime, 'HH:mm');
        const bookingEnd = format(booking.endTime, 'HH:mm');
        return format(booking.startTime, 'yyyy-MM-dd') === dateStr &&
               timeStr >= bookingStart && timeStr < bookingEnd;
      });

      availability[dateStr].push({
        time: timeStr,
        available: !isBooked,
        bookingId: bookedSlot?.id
      });
    });

    return NextResponse.json({ availability });
  } catch (error) {
    logger.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const { providerId } = params;
    const body = await request.json();
    const { date, startTime, endTime, serviceId, available = true } = body;

    if (available) {
      // Create availability slot
      await prisma.availabilitySlot.create({
        data: {
          providerId,
          serviceId,
          date: new Date(date),
          startTime,
          endTime,
          isAvailable: true
        }
      });
    } else {
      // Remove availability slot
      await prisma.availabilitySlot.deleteMany({
        where: {
          providerId,
          serviceId,
          date: new Date(date),
          startTime
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}