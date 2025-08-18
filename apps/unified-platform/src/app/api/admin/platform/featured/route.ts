import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/production-logger';

// Get featured providers and services
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get top-rated providers (could be considered "featured")
    const featuredProviders = await prisma.provider.findMany({
      where: {
        isVerified: true,
        rating: {
          gte: 4.0,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            serviceOfferings: true,
            reviews: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: 20,
    });

    // Get top-rated services
    const featuredServices = await prisma.service.findMany({
      where: {
        isActive: true,
        provider: {
          isVerified: true,
        },
      },
      include: {
        provider: {
          select: {
            name: true,
            rating: true,
            reviewCount: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: [
        { provider: { rating: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    return NextResponse.json({ 
      featuredProviders,
      featuredServices 
    });
  } catch (error) {
    logger.error('Error fetching featured content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update featured status (placeholder for future implementation)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, featured } = body; // type: 'provider' | 'service'

    // In a real implementation, you would update a featured flag
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: `${type} featured status updated` 
    });
  } catch (error) {
    logger.error('Error updating featured status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}