import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const providerId = searchParams.get('providerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // If specific provider is requested
    if (userId || providerId) {
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
    }

    // Fetch all providers for admin (no specific userId or providerId)
    const skip = (page - 1) * limit;
    
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { user: { name: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ]
    } : {};

    const [providers, totalCount] = await Promise.all([
      prisma.provider.findMany({
        where: whereClause,
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
        },
        orderBy: [
          { isVerified: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.provider.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      providers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch provider information' 
      },
      { status: 500 }
    );
  }
}