import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';
import { withAuth } from '@/lib/api-middleware';

const locationQuerySchema = z.object({
  q: z.string().min(1, 'Query is required').max(100, 'Query too long').trim(),
  limit: z.string().transform(val => Math.min(20, Math.max(1, parseInt(val) || 10))),
});

interface LocationSuggestion {
  id: string;
  name: string;
  type: 'city' | 'region' | 'venue';
}

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { q: query, limit } = locationQuerySchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit') || '10',
    });

    logger.info('Fetching location suggestions', { query, limit });

    // Get unique locations from services and providers
    const [serviceLocations, providerLocations] = await Promise.all([
      // Get locations from services
      prisma.service.findMany({
        where: {
          location: {
            contains: query,
            mode: 'insensitive',
          },
          isActive: true,
        },
        select: {
          location: true,
        },
        distinct: ['location'],
        take: limit,
      }),
      
      // Get locations from providers
      prisma.provider.findMany({
        where: {
          location: {
            contains: query,
            mode: 'insensitive',
          },
          isVerified: true,
        },
        select: {
          location: true,
        },
        distinct: ['location'],
        take: limit,
      }),
    ]);

    // Combine and deduplicate locations
    const allLocations = new Set<string>();
    
    serviceLocations.forEach(service => {
      if (service.location) {
        allLocations.add(service.location);
      }
    });
    
    providerLocations.forEach(provider => {
      if (provider.location) {
        allLocations.add(provider.location);
      }
    });

    // Convert to suggestion format
    const suggestions: LocationSuggestion[] = Array.from(allLocations)
      .slice(0, limit)
      .map((location, index) => ({
        id: `location-${index}`,
        name: location,
        type: 'city' as const, // Default to city type
      }));

    logger.info('Location suggestions fetched successfully', { 
      query, 
      resultCount: suggestions.length 
    });

    return NextResponse.json({
      success: true,
      locations: suggestions,
      total: suggestions.length,
    });

  } catch (error) {
    logger.error('Failed to fetch location suggestions:', error, {
      url: request.url,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch location suggestions',
        locations: [], // Return empty array instead of fallback data
      },
      { status: 500 }
    );
  }
}

export const GET = handleGET;