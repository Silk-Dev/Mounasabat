import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';

const prisma = new PrismaClient();

// Get user bookings with pagination
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
    const upcoming = url.searchParams.get('upcoming') === 'true';
    const past = url.searchParams.get('past') === 'true';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      userId: session.user.id,
      ...(status && { status: status.toUpperCase() }),
    };
    
    // Filter for upcoming or past bookings
    const now = new Date();
    if (upcoming) {
      where.startTime = { gte: now };
    } else if (past) {
      where.endTime = { lt: now };
    }
    
    // Get bookings with count
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: upcoming ? 'asc' : 'desc' },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      }),
      prisma.booking.count({ where }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      bookings,
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
    console.error('Error fetching user bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch user bookings' }, { status: 500 });
  }
}