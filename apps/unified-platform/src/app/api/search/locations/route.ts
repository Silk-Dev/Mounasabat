import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        locations: [],
        message: 'Query too short for location suggestions',
      });
    }

    // Get unique locations from services and providers
    const [serviceLocations, providerLocations] = await Promise.all([
      // Get locations from services
      prisma.service.findMany({
        where: {
          isActive: true,
          location: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          location: true,
        },
        distinct: ['location'],
        take: limit,
      }),

      // Get locations from provider coverage areas
      prisma.provider.findMany({
        where: {
          isActive: true,
          coverageAreas: {
            hasSome: [query],
          },
        },
        select: {
          coverageAreas: true,
        },
        take: limit,
      }),
    ]);

    // Combine and deduplicate locations
    const allLocations = new Set<string>();
    
    // Add service locations
    serviceLocations.forEach(service => {
      if (service.location) {
        allLocations.add(service.location);
      }
    });

    // Add provider coverage areas that match the query
    providerLocations.forEach(provider => {
      provider.coverageAreas.forEach(area => {
        if (area.toLowerCase().includes(query.toLowerCase())) {
          allLocations.add(area);
        }
      });
    });

    // Convert to location suggestion format
    const locations = Array.from(allLocations)
      .slice(0, limit)
      .map((location, index) => ({
        id: `loc-${index}`,
        name: location,
        type: 'city' as const,
      }));

    return NextResponse.json({
      success: true,
      locations,
      total: locations.length,
    });

  } catch (error) {
    console.error('Location suggestions API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while fetching location suggestions',
        locations: [],
      },
      { status: 500 }
    );
  }
}