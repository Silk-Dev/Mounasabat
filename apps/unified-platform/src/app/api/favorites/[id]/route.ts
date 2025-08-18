import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const favoriteId = params.id;

    if (!favoriteId) {
      return NextResponse.json(
        { error: 'Favorite ID is required' },
        { status: 400 }
      );
    }

    // Check if favorite exists
    const favorite = await prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite removed',
    });
  } catch (error) {
    logger.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}