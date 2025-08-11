import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ordersQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  orderType: z.enum(['BOOKING', 'PRODUCT', 'CONCIERGE']).optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = ordersQuerySchema.parse(queryParams);

    const {
      userId,
      status,
      orderType,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    } = validatedQuery;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (search) {
      where.OR = [
        {
          event: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
            },
          },
          tracking: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 1, // Get latest tracking entry
          },
          package: {
            select: {
              id: true,
              name: true,
              provider: {
                select: {
                  id: true,
                  name: true,
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
            },
          },
          issues: {
            where: {
              status: {
                not: 'CLOSED',
              },
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate summary for each order
    const ordersWithSummary = orders.map(order => {
      const totalPaid = order.payments
        .filter(payment => payment.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0);

      const totalRefunded = order.payments
        .filter(payment => payment.status === 'REFUNDED')
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        ...order,
        summary: {
          totalAmount: order.totalAmount,
          totalPaid,
          totalRefunded,
          balance: order.totalAmount - totalPaid + totalRefunded,
          itemCount: order.items.length,
          hasActiveIssues: order.issues.length > 0,
          latestStatus: order.tracking[0]?.status || order.status,
          latestUpdate: order.tracking[0]?.timestamp || order.updatedAt,
        },
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      orders: ordersWithSummary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Orders retrieval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new order (for admin/system use)
const createOrderSchema = z.object({
  userId: z.string(),
  orderType: z.enum(['BOOKING', 'PRODUCT', 'CONCIERGE']),
  totalAmount: z.number().min(0),
  packageId: z.string().optional(),
  eventId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    customization: z.any().optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const {
      userId,
      orderType,
      totalAmount,
      packageId,
      eventId,
      items,
    } = validatedData;

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderType,
          status: 'PENDING',
          totalAmount,
          packageId,
          eventId,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customization: item.customization,
        })),
      });

      // Create initial tracking entry
      await tx.orderTracking.create({
        data: {
          orderId: newOrder.id,
          status: 'ORDER_CREATED',
          description: 'Order created successfully',
          timestamp: new Date(),
        },
      });

      // Send notification to user
      await tx.notification.create({
        data: {
          userId,
          type: 'IN_APP',
          title: 'Order Created',
          message: `Your order has been created successfully. Order total: $${totalAmount.toFixed(2)}`,
          data: {
            orderId: newOrder.id,
            orderType,
            totalAmount,
          },
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully',
    });

  } catch (error) {
    console.error('Order creation error:', error);

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