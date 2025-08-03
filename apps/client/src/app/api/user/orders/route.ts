import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';

const prisma = new PrismaClient();

// Get user orders with pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || undefined;
    const orderType = url.searchParams.get('type') || undefined;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      userId: session.user.id,
      ...(status && { status: status.toUpperCase() }),
      ...(orderType && { orderType: orderType.toUpperCase() }),
    };
    
    // Get orders with count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          package: {
            select: {
              id: true,
              name: true,
              providerId: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        }
      }),
      prisma.order.count({ where }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch user orders' }, { status: 500 });
  }
}