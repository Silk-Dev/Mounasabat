import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const providerId = searchParams.get('providerId');

    if (!userId && !providerId) {
      return NextResponse.json(
        { success: false, error: 'Either userId or providerId is required' },
        { status: 400 }
      );
    }

    let provider;

    if (providerId) {
      provider = await prisma.provider.findUnique({
        where: { id: providerId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          serviceOfferings: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              category: true,
            }
          },
          _count: {
            select: {
              serviceOfferings: true,
              reviews: true,
            }
          }
        }
      });
    } else {
      provider = await prisma.provider.findUnique({
        where: { userId: userId! },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          serviceOfferings: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              category: true,
            }
          },
          _count: {
            select: {
              serviceOfferings: true,
              reviews: true,
            }
          }
        }
      });
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      provider,
    });

  } catch (error) {
    logger.error('Error fetching provider:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch provider information' 
      },
      { status: 500 }
    );
  }
}