import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { logger } from '../../../lib/production-logger';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';
import { withApiValidation } from '@/lib/api-validation-middleware';
import { ValidationSchemas } from '@/lib/validation-schemas';

// Enhanced validation schema for services query parameters
const servicesQuerySchema = z.object({
  providerId: z.string().uuid('Invalid provider ID format').optional(),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  offset: z.string().transform(val => Math.max(0, parseInt(val) || 0)),
  sortBy: z.enum(['price', 'rating', 'name', 'createdAt', 'reviewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().max(50, 'Category filter too long').trim().regex(/^[a-zA-Z0-9\-_\s]+$/, 'Invalid category format').optional(),
  subcategory: z.string().max(50, 'Subcategory filter too long').trim().regex(/^[a-zA-Z0-9\-_\s]+$/, 'Invalid subcategory format').optional(),
  minPrice: z.string().transform(val => {
    const price = parseFloat(val);
    return isNaN(price) ? undefined : Math.max(0, price);
  }).optional(),
  maxPrice: z.string().transform(val => {
    const price = parseFloat(val);
    return isNaN(price) ? undefined : Math.max(0, price);
  }).optional(),
  minRating: z.string().transform(val => {
    const rating = parseFloat(val);
    return isNaN(rating) ? undefined : Math.max(0, Math.min(5, rating));
  }).optional(),
  isActive: z.enum(['true', 'false', 'all']).default('true'),
}).strict();

async function handleGET(request: NextRequest) {
  // Get validated data from the middleware
  const validatedData = (request as any).validatedData;
  const validatedQuery = validatedData?.query || {};
  const { 
    providerId, 
    limit, 
    offset, 
    sortBy, 
    sortOrder, 
    category, 
    subcategory, 
    minPrice, 
    maxPrice, 
    minRating, 
    isActive 
  } = validatedQuery;

  // Build where clause with proper sanitization
  const where: any = {};

  if (isActive === 'true') {
    where.isActive = true;
  } else if (isActive === 'false') {
    where.isActive = false;
  }

  if (providerId) {
    where.providerId = providerId;
  }

  if (category) {
    where.category = {
      contains: category,
      mode: 'insensitive',
    };
  }

  if (subcategory) {
    where.subcategory = {
      contains: subcategory,
      mode: 'insensitive',
    };
  }

  // Price range filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {};
    if (minPrice !== undefined) {
      where.basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.basePrice.lte = maxPrice;
    }
  }

  // Rating filtering (requires aggregation)
  let havingClause: any = undefined;
  if (minRating !== undefined) {
    havingClause = {
      avgRating: {
        gte: minRating,
      },
    };
  }

  // Build order by clause
  const orderBy: any = {};
  switch (sortBy) {
    case 'price':
      orderBy.basePrice = sortOrder;
      break;
    case 'rating':
      orderBy.provider = { rating: sortOrder };
      break;
    case 'name':
      orderBy.name = sortOrder;
      break;
    case 'reviewCount':
      // This would need to be handled with aggregation
      orderBy.createdAt = sortOrder; // Fallback
      break;
    default:
      orderBy.createdAt = sortOrder;
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            address: true,
            location: true,
          },
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
    prisma.service.count({ where }),
  ]);

  // Transform services to include calculated ratings with proper error handling
  const transformedServices = services.map(service => {
    try {
      const avgRating = service.reviews.length > 0
        ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
        : 0;

      // Parse location safely
      let location: any = null;
      if (service.location) {
        try {
          location = typeof service.location === 'string' 
            ? JSON.parse(service.location) 
            : service.location;
        } catch (locationError) {
          logger.warn('Error parsing service location:', locationError, { serviceId: service.id });
          location = null;
        }
      }

      return {
        id: service.id,
        providerId: service.providerId,
        name: service.name || 'Unnamed Service',
        description: service.description || '',
        category: service.category || 'uncategorized',
        subcategory: service.subcategory || undefined,
        basePrice: service.basePrice || 0,
        priceUnit: service.priceUnit || 'fixed',
        images: Array.isArray(service.images) ? service.images : [],
        features: [], // Would need to be added to schema or derived
        isActive: service.isActive,
        location,
        coverageArea: Array.isArray(service.coverageArea) ? service.coverageArea : [],
        pricingType: service.pricingType || 'fixed',
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: service.reviews.length,
        provider: {
          ...service.provider,
          name: service.provider.name || 'Unknown Provider',
          address: service.provider.address || '',
        },
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    } catch (transformError) {
      logger.error('Error transforming service data:', transformError, { serviceId: service.id });
      // Return a minimal safe version
      return {
        id: service.id,
        providerId: service.providerId,
        name: service.name || 'Unnamed Service',
        description: '',
        category: 'uncategorized',
        subcategory: undefined,
        basePrice: 0,
        priceUnit: 'fixed',
        images: [],
        features: [],
        isActive: false,
        location: null,
        coverageArea: [],
        pricingType: 'fixed',
        rating: 0,
        reviewCount: 0,
        provider: {
          id: service.providerId,
          name: 'Unknown Provider',
          rating: 0,
          reviewCount: 0,
          isVerified: false,
          address: '',
          location: null,
        },
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    }
  });

  // Filter by calculated rating if needed
  const filteredServices = minRating !== undefined 
    ? transformedServices.filter(service => service.rating >= minRating)
    : transformedServices;

  // Calculate additional statistics
  const statistics = {
    totalServices: total,
    activeServices: await prisma.service.count({ where: { isActive: true } }),
    averagePrice: services.length > 0 
      ? Math.round((services.reduce((sum, s) => sum + (s.basePrice || 0), 0) / services.length) * 100) / 100
      : 0,
    averageRating: filteredServices.length > 0 
      ? Math.round((filteredServices.reduce((sum, s) => sum + s.rating, 0) / filteredServices.length) * 10) / 10
      : 0,
    categoryDistribution: await prisma.service.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    }),
  };

  return ApiResponseBuilder.success({
    services: filteredServices,
    statistics,
    pagination: {
      total: filteredServices.length, // Use filtered count
      limit,
      offset,
      hasMore: offset + limit < filteredServices.length,
    },
  }, 'Services retrieved successfully');
}

// Export wrapped handler with validation and error handling
export const GET = withApiValidation(
  withApiMiddleware(handleGET, {
    component: 'services_api',
    logRequests: true,
  }),
  {
    querySchema: servicesQuerySchema,
    sanitizeInputs: true,
    enableXSSProtection: true,
    enableSQLInjectionProtection: true,
    logValidationErrors: true,
  }
);