import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@mounasabet/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const verified = searchParams.get('verified');

    const where: any = {};

    if (verified === 'true') {
      where.isVerified = true;
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy.rating = 'desc';
        break;
      case 'name':
        orderBy.name = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
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
      prisma.provider.count({ where }),
    ]);

    // Transform providers to match the expected interface
    const transformedProviders = providers.map(provider => {
      const avgRating = provider.reviews.length > 0
        ? provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length
        : provider.rating || 0;

      return {
        id: provider.id,
        userId: provider.userId,
        businessName: provider.name,
        description: provider.description || '',
        images: [], // Would need to be added to schema or derived
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: provider.reviews.length,
        isVerified: provider.isVerified,
        location: {
          address: provider.address || '',
          city: '', // Would need to be parsed from address or added to schema
          coordinates: provider.location ? [
            (provider.location as any).lat || 0,
            (provider.location as any).lng || 0
          ] : [0, 0] as [number, number],
        },
        services: provider.serviceOfferings.map(service => ({
          id: service.id,
          providerId: provider.id,
          name: service.name,
          description: service.description || '',
          category: service.category,
          subcategory: undefined,
          basePrice: service.basePrice || 0,
          priceUnit: service.priceUnit || 'fixed',
          images: service.images,
          features: [], // Would need to be added to schema
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        })),
        coverageAreas: provider.coverageAreas,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      providers: transformedProviders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}