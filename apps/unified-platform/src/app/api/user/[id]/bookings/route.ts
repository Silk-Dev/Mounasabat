import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            name: true,
            type: true,
          },
        },
        service: {
          select: {
            name: true,
            provider: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get order information for pricing
    const bookingIds = bookings.map(b => b.id);
    const orders = await prisma.order.findMany({
      where: {
        userId,
        // Assuming there's a relationship between bookings and orders
      },
      include: {
        items: true,
      },
    });

    // Transform bookings to match expected format
    const transformedBookings = bookings.map(booking => {
      // Find related order for pricing information
      const relatedOrder = orders.find(order => 
        // This would depend on how bookings and orders are related
        order.createdAt.getTime() === booking.createdAt.getTime()
      );

      const totalAmount = relatedOrder?.totalAmount || 0;
      const estimatedTaxes = totalAmount * 0.1; // 10% tax estimate
      const estimatedFees = totalAmount * 0.05; // 5% fees estimate
      const subtotal = totalAmount - estimatedTaxes - estimatedFees;

      return {
        id: booking.id,
        eventDate: booking.startTime,
        status: booking.status,
        eventDetails: {
          type: booking.event?.type || 'Event',
          name: booking.event?.name,
        },
        service: {
          name: booking.service?.name,
          provider: booking.service?.provider?.name,
        },
        pricing: {
          total: totalAmount,
          subtotal: Math.max(0, subtotal),
          taxes: estimatedTaxes,
          fees: estimatedFees,
        },
        createdAt: booking.createdAt,
      };
    });

    const total = await prisma.booking.count({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      data: transformedBookings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}