import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/../../packages/database/src/generated/client';
import { logger } from '../../../lib/production-logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        provider: {
          include: {
            user: true,
          },
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform favorites to match FavoriteItem interface
    const favoriteItems = await Promise.all(
      favorites.map(async (favorite) => {
        if (favorite.provider) {
          // Get the lowest service price for this provider
          const services = await prisma.service.findMany({
            where: { 
              providerId: favorite.provider.id,
              isActive: true 
            },
            select: { basePrice: true },
            orderBy: { basePrice: 'asc' },
            take: 1,
          });

          const basePrice = services.length > 0 ? services[0].basePrice : 0;

          return {
            id: favorite.id,
            type: 'provider' as const,
            name: favorite.provider.name,
            description: favorite.provider.description,
            images: [], // Provider images would be stored in a separate table
            rating: favorite.provider.rating,
            reviewCount: favorite.provider.reviewCount,
            basePrice,
            location: favorite.provider.address,
            category: 'Service Provider',
            provider: {
              id: favorite.provider.id,
              name: favorite.provider.name,
              isVerified: favorite.provider.isVerified,
            },
            createdAt: favorite.createdAt,
          };
        } else if (favorite.product) {
          return {
            id: favorite.id,
            type: 'product' as const,
            name: favorite.product.name,
            description: favorite.product.description,
            images: favorite.product.images,
            rating: undefined,
            reviewCount: undefined,
            basePrice: favorite.product.basePrice,
            location: undefined,
            category: favorite.product.category,
            createdAt: favorite.createdAt,
          };
        }
        return null;
      })
    );

    const validFavoriteItems = favoriteItems.filter(Boolean);

    return NextResponse.json({
      success: true,
      favorites: validFavoriteItems,
    });
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId, itemType } = await request.json();

    if (!userId || !itemId || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['provider', 'product'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        ...(itemType === 'provider' ? { providerId: itemId } : { productId: itemId }),
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Item already in favorites' },
        { status: 409 }
      );
    }

    // Verify the item exists
    if (itemType === 'provider') {
      const provider = await prisma.provider.findUnique({
        where: { id: itemId },
      });
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }
    } else {
      const product = await prisma.product.findUnique({
        where: { id: itemId },
      });
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        ...(itemType === 'provider' ? { providerId: itemId } : { productId: itemId }),
      },
      include: {
        provider: {
          include: {
            user: true,
          },
        },
        product: true,
      },
    });

    // Transform to FavoriteItem format
    let favoriteItem;
    if (favorite.provider) {
      // Get the lowest service price for this provider
      const services = await prisma.service.findMany({
        where: { 
          providerId: favorite.provider.id,
          isActive: true 
        },
        select: { basePrice: true },
        orderBy: { basePrice: 'asc' },
        take: 1,
      });

      const basePrice = services.length > 0 ? services[0].basePrice : 0;

      favoriteItem = {
        id: favorite.id,
        type: 'provider' as const,
        name: favorite.provider.name,
        description: favorite.provider.description,
        images: [],
        rating: favorite.provider.rating,
        reviewCount: favorite.provider.reviewCount,
        basePrice,
        location: favorite.provider.address,
        category: 'Service Provider',
        provider: {
          id: favorite.provider.id,
          name: favorite.provider.name,
          isVerified: favorite.provider.isVerified,
        },
        createdAt: favorite.createdAt,
      };
    } else if (favorite.product) {
      favoriteItem = {
        id: favorite.id,
        type: 'product' as const,
        name: favorite.product.name,
        description: favorite.product.description,
        images: favorite.product.images,
        rating: undefined,
        reviewCount: undefined,
        basePrice: favorite.product.basePrice,
        location: undefined,
        category: favorite.product.category,
        createdAt: favorite.createdAt,
      };
    }

    return NextResponse.json(favoriteItem);
  } catch (error) {
    logger.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'All favorites cleared',
    });
  } catch (error) {
    logger.error('Error clearing favorites:', error);
    return NextResponse.json(
      { error: 'Failed to clear favorites' },
      { status: 500 }
    );
  }
}