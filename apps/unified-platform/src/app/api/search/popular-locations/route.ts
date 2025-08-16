import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';

async function handleGET(request: NextRequest) {
  try {
    logger.info('Fetching popular locations');

    // Get the most common locations from services and providers
    const [serviceLocations, providerLocations] = await Promise.all([
      // Get locations from services with counts
      prisma.service.groupBy({
        by: ['location'],
        where: {
          location: {
            not: null,
          },
          isActive: true,
        },
        _count: {
          location: true,
        },
        orderBy: {
          _count: {
            location: 'desc',
          },
        },
        take: 10,
      }),
      
      // Get locations from providers with counts
      prisma.provider.groupBy({
        by: ['location'],
        where: {
          location: {
            not: null,
          },
          isVerified: true,
        },
        _count: {
          location: true,
        },
        orderBy: {
          _count: {
            location: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Combine and rank locations by total count
    const locationCounts = new Map<string, number>();
    
    serviceLocations.forEach(item => {
      if (item.location) {
        locationCounts.set(item.location, (locationCounts.get(item.location) || 0) + item._count.location);
      }
    });
    
    providerLocations.forEach(item => {
      if (item.location) {
        locationCounts.set(item.location, (locationCounts.get(item.location) || 0) + item._count.location);
      }
    });

    // Sort by count and get top locations
    const popularLocations = Array.from(locationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([location]) => location);

    logger.info('Popular locations fetched successfully', { 
      resultCount: popularLocations.length 
    });

    return NextResponse.json({
      success: true,
      locations: popularLocations,
      total: popularLocations.length,
    });

  } catch (error) {
    logger.error('Failed to fetch popular locations:', error, {
      url: request.url,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch popular locations',
        locations: [], // Return empty array instead of fallback data
      },
      { status: 500 }
    );
  }
}

export const GET = handleGET;