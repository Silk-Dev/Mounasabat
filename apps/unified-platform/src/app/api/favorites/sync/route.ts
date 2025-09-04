import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, localFavorites } = await request.json();

    if (!userId || !Array.isArray(localFavorites)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const syncedFavorites = [];

    for (const favoriteKey of localFavorites) {
      const [itemType, itemId] = favoriteKey.split('_');
      
      if (!['provider', 'product'].includes(itemType) || !itemId) {
        continue;
      }

      try {
        // Check if already exists
        const existingFavorite = await prisma.favorite.findFirst({
          where: {
            userId,
            ...(itemType === 'provider' ? { providerId: itemId } : { productId: itemId }),
          },
        });

        if (existingFavorite) {
          continue;
        }

        // Verify the item exists
        if (itemType === 'provider') {
          const provider = await prisma.provider.findUnique({
            where: { id: itemId },
          });
          if (!provider) continue;
        } else {
          const product = await prisma.product.findUnique({
            where: { id: itemId },
          });
          if (!product) continue;
        }

        // Create the favorite
        const favorite = await prisma.favorite.create({
          data: {
            userId,
            ...(itemType === 'provider' ? { providerId: itemId } : { productId: itemId }),
          },
        });

        syncedFavorites.push(favorite);
      } catch (error) {
        logger.error(`Failed to sync favorite ${favoriteKey}:`, error);
        // Continue with other favorites
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedFavorites.length,
      message: `Synced ${syncedFavorites.length} favorites`,
    });
  } catch (error) {
    logger.error('Error syncing favorites:', error);
    return NextResponse.json(
      { error: 'Failed to sync favorites' },
      { status: 500 }
    );
  }
}