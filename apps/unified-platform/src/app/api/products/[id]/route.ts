import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        customizationOptions: true,
        favorites: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform product data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice,
      images: product.images,
      isCustomizable: product.isCustomizable,
      isActive: product.isActive,
      inventory: product.inventory,
      customizationOptions: product.customizationOptions,
      favoriteCount: product.favorites.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    logger.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}