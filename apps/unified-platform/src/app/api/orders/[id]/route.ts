import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  trackingUpdate: z.object({
    status: z.string(),
    description: z.string().optional(),
    updatedBy: z.string().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
        payments: true,
        tracking: {
          orderBy: {
            timestamp: 'desc',
          },
        },
        package: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                contactEmail: true,
                phoneNumber: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            startDate: true,
            endDate: true,
          },
        },
        issues: {
          where: {
            status: {
              not: 'CLOSED',
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate order summary
    const totalPaid = order.payments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalRefunded = order.payments
      .filter(payment => payment.status === 'REFUNDED')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const orderSummary = {
      ...order,
      summary: {
        totalAmount: order.totalAmount,
        totalPaid,
        totalRefunded,
        balance: order.totalAmount - totalPaid + totalRefunded,
        itemCount: order.items.length,
        hasActiveIssues: order.issues.length > 0,
      },
    };

    return NextResponse.json({
      success: true,
      order: orderSummary,
    });

  } catch (error) {
    console.error('Order retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const { status, trackingUpdate } = validatedData;

    const result = await prisma.$transaction(async (tx) => {
      // Update order status if provided
      let updatedOrder = null;
      if (status) {
        updatedOrder = await tx.order.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date(),
          },
        });
      }

      // Add tracking update if provided
      let trackingEntry = null;
      if (trackingUpdate) {
        trackingEntry = await tx.orderTracking.create({
          data: {
            orderId: id,
            status: trackingUpdate.status,
            description: trackingUpdate.description,
            timestamp: new Date(),
            updatedBy: trackingUpdate.updatedBy,
          },
        });
      }

      // Get updated order with all relations
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
          payments: true,
          tracking: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 5, // Get latest 5 tracking entries
          },
        },
      });

      return { order, trackingEntry };
    });

    // Send notification if status changed
    if (status && result.order) {
      await prisma.notification.create({
        data: {
          userId: result.order.userId,
          type: 'IN_APP',
          title: 'Order Status Updated',
          message: `Your order status has been updated to: ${status}`,
          data: {
            orderId: id,
            newStatus: status,
            trackingUpdate: trackingUpdate?.description,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      trackingEntry: result.trackingEntry,
    });

  } catch (error) {
    console.error('Order update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if order can be cancelled
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed order' },
        { status: 400 }
      );
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel the order
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Add tracking entry
      await tx.orderTracking.create({
        data: {
          orderId: id,
          status: 'CANCELLED',
          description: 'Order cancelled by request',
          timestamp: new Date(),
        },
      });

      // Cancel related bookings
      await tx.booking.updateMany({
        where: {
          eventId: order.eventId,
          userId: order.userId,
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Send notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'EMAIL',
          title: 'Order Cancelled',
          message: 'Your order has been cancelled. If you made a payment, a refund will be processed within 5-10 business days.',
          data: {
            orderId: id,
            cancelledAt: new Date().toISOString(),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    });

  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}