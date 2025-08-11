import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/../../packages/database/src/generated/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        provider: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform reviews to match expected format
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      provider: review.provider?.name,
      service: review.service?.name,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    const total = await prisma.review.count({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      data: transformedReviews,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}