import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/production-logger';

import { ApiResponseBuilder } from '@/lib/api-response';
import { validateRequiredFields } from '@/lib/api-response';

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

// Create new order (for admin/system use)
const createOrderSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  orderType: z.enum(['BOOKING', 'PRODUCT', 'CONCIERGE']),
  totalAmount: z.number().min(0).max(1000000, 'Amount exceeds maximum limit'),
  packageId: z.string().uuid('Invalid package ID format').optional(),
  eventId: z.string().uuid('Invalid event ID format').optional(),
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID format').optional(),
    name: z.string().min(1, 'Item name is required').max(200, 'Item name too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000, 'Quantity exceeds maximum'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative').max(100000, 'Unit price exceeds maximum'),
    totalPrice: z.number().min(0, 'Total price cannot be negative').max(100000, 'Total price exceeds maximum'),
    customization: z.any().optional(),
  })).min(1, 'At least one item is required').max(50, 'Too many items'),
});

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Validate query parameters
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

  // Sanitize pagination
  const sanitizedPage = Math.max(1, page);
  const sanitizedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  // Build where clause with proper sanitization
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
    const sanitizedSearch = search.trim();
    if (sanitizedSearch.length > 0) {
      where.OR = [
        {
          event: {
            name: {
              contains: sanitizedSearch,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            name: {
              contains: sanitizedSearch,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: sanitizedSearch,
              mode: 'insensitive',
            },
          },
        },
      ];
    }
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
      take: sanitizedLimit,
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

  const totalPages = Math.ceil(totalCount / sanitizedLimit);

  return ApiResponseBuilder.success({
    orders: ordersWithSummary,
    pagination: {
      page: sanitizedPage,
      limit: sanitizedLimit,
      totalCount,
      totalPages,
      hasNext: sanitizedPage < totalPages,
      hasPrev: sanitizedPage > 1,
    },
  }, 'Orders retrieved successfully');
}

async function handlePOST(request: NextRequest) {
  const body = await request.json();
  
  // Validate required fields
  const requiredFields = ['userId', 'orderType', 'totalAmount', 'items'];
  const missingFields = validateRequiredFields(body, requiredFields);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate and sanitize data
  const validatedData = createOrderSchema.parse(body);

  const {
    userId,
    orderType,
    totalAmount,
    packageId,
    eventId,
    items,
  } = validatedData;

  // Validate that total amount matches sum of item totals
  const calculatedTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
    throw new Error('Total amount does not match sum of item prices');
  }

  const order = await prisma.$transaction(async (tx) => {
    // Verify user exists
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify package exists if provided
    if (packageId) {
      const packageExists = await tx.package.findUnique({
        where: { id: packageId },
        select: { id: true },
      });

      if (!packageExists) {
        throw new Error('Package not found');
      }
    }

    // Verify event exists if provided
    if (eventId) {
      const eventExists = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

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

  return ApiResponseBuilder.success({
    order,
  }, 'Order created successfully');
}

// Export handlers directly
export const GET = handleGET;
export const POST = handlePOST;