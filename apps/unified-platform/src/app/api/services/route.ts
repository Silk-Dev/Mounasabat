import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const category = searchParams.get('category');

    const where: any = {
      isActive: true,
    };

    if (providerId) {
      where.providerId = providerId;
    }

    if (category) {
      where.category = category;
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.basePrice = 'asc';
        break;
      case 'rating':
        orderBy.provider = { rating: 'desc' };
        break;
      case 'name':
        orderBy.name = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
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
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.service.count({ where }),
    ]);

    // Transform services to include calculated ratings
    const transformedServices = services.map(service => {
      const avgRating = service.reviews.length > 0
        ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
        : 0;

      return {
        id: service.id,
        providerId: service.providerId,
        name: service.name,
        description: service.description || '',
        category: service.category,
        subcategory: undefined, // Not available in current schema
        basePrice: service.basePrice || 0,
        priceUnit: service.priceUnit || 'fixed',
        images: service.images,
        features: [], // Would need to be added to schema or derived
        isActive: service.isActive,
        location: service.location,
        coverageArea: service.coverageArea,
        pricingType: service.pricingType,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: service.reviews.length,
        provider: service.provider,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      services: transformedServices,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}