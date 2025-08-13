import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const where: any = { providerId };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (startDate) {
      where.startTime = {
        gte: new Date(startDate)
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            basePrice: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.booking.count({ where });

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bookings' 
      },
      { status: 500 }
    );
  }
}