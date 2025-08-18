import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

// Validation schema for query parameters
const providersQuerySchema = z.object({
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  offset: z.string().transform(val => Math.max(0, parseInt(val) || 0)),
  sortBy: z.enum(['rating', 'name', 'createdAt', 'reviewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  verified: z.enum(['true', 'false', 'all']).optional(),
  category: z.string().max(50, 'Category filter too long').trim().optional(),
  location: z.string().max(100, 'Location filter too long').trim().optional(),
  minRating: z.string().transform(val => {
    const rating = parseFloat(val);
    return isNaN(rating) ? undefined : Math.max(0, Math.min(5, rating));
  }).optional(),
});

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Validate and sanitize query parameters
  const validatedQuery = providersQuerySchema.parse(queryParams);
  const { limit, offset, sortBy, sortOrder, verified, category, location, minRating } = validatedQuery;

  // Build where clause with proper sanitization
  const where: any = {};

  if (verified === 'true') {
    where.isVerified = true;
  } else if (verified === 'false') {
    where.isVerified = false;
  }

  if (category) {
    where.serviceOfferings = {
      some: {
        category: {
          contains: category,
          mode: 'insensitive',
        },
        isActive: true,
      },
    };
  }

  if (location) {
    where.OR = [
      {
        address: {
          contains: location,
          mode: 'insensitive',
        },
      },
      {
        coverageAreas: {
          hasSome: [location],
        },
      },
    ];
  }

  if (minRating !== undefined) {
    where.rating = {
      gte: minRating,
    };
  }

  // Build order by clause
  const orderBy: any = {};
  switch (sortBy) {
    case 'rating':
      orderBy.rating = sortOrder;
      break;
    case 'name':
      orderBy.name = sortOrder;
      break;
    case 'reviewCount':
      orderBy.reviewCount = sortOrder;
      break;
    default:
      orderBy.createdAt = sortOrder;
  }

  const [providers, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceOfferings: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            basePrice: true,
            priceUnit: true,
            images: true,
            pricingType: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 10, // Limit services per provider to avoid large responses
        },
        reviews: {
          select: {
            rating: true,
          },
          take: 100, // Limit reviews for performance
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.provider.count({ where }),
  ]);

  // Transform providers to match the expected interface with proper error handling
  const transformedProviders = providers.map(provider => {
    try {
      const avgRating = provider.reviews.length > 0
        ? provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length
        : provider.rating || 0;

      // Parse location safely
      let coordinates: [number, number] = [0, 0];
      if (provider.location) {
        try {
          const locationData = provider.location as any;
          coordinates = [
            typeof locationData.lat === 'number' ? locationData.lat : 0,
            typeof locationData.lng === 'number' ? locationData.lng : 0
          ];
        } catch (locationError) {
          logger.warn('Error parsing provider location:', locationError, { providerId: provider.id });
        }
      }

      return {
        id: provider.id,
        userId: provider.userId,
        businessName: provider.name || 'Unknown Business',
        description: provider.description || '',
        images: [], // Would need to be added to schema or derived
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: provider.reviews.length,
        isVerified: provider.isVerified,
        location: {
          address: provider.address || '',
          city: '', // Would need to be parsed from address or added to schema
          coordinates,
        },
        services: provider.serviceOfferings.map(service => ({
          id: service.id,
          providerId: provider.id,
          name: service.name || 'Unnamed Service',
          description: service.description || '',
          category: service.category || 'uncategorized',
          subcategory: undefined,
          basePrice: service.basePrice || 0,
          priceUnit: service.priceUnit || 'fixed',
          images: Array.isArray(service.images) ? service.images : [],
          features: [], // Would need to be added to schema
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
        coverageAreas: Array.isArray(provider.coverageAreas) ? provider.coverageAreas : [],
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      };
    } catch (transformError) {
      logger.error('Error transforming provider data:', transformError, { providerId: provider.id });
      // Return a minimal safe version
      return {
        id: provider.id,
        userId: provider.userId,
        businessName: provider.name || 'Unknown Business',
        description: '',
        images: [],
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        location: {
          address: '',
          city: '',
          coordinates: [0, 0] as [number, number],
        },
        services: [],
        coverageAreas: [],
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      };
    }
  });

  // Calculate additional statistics
  const statistics = {
    totalProviders: total,
    verifiedProviders: await prisma.provider.count({ where: { isVerified: true } }),
    averageRating: providers.length > 0 
      ? Math.round((providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length) * 10) / 10
      : 0,
    categoryDistribution: await prisma.serviceOffering.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    }),
  };

  return ApiResponseBuilder.success({
    providers: transformedProviders,
    statistics,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  }, 'Providers retrieved successfully');
}

// Export wrapped handler with proper error handling
export const GET = withApiMiddleware(handleGET, {
  component: 'providers_api',
  logRequests: true,
});