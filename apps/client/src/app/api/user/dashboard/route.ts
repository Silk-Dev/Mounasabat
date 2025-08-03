import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';
import { detectLanguage, getUserProfileMessages, type Language } from '@mounasabet/utils';

const prisma = new PrismaClient();

// Get user dashboard data
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user language preference or detect from request
    const userLanguage = (session.user.language as Language) || 
      detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(userLanguage);
    
    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        language: true,
        preferences: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: messages.profile.notFound 
      }, { status: 404 });
    }
    
    // Get recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          take: 1,
        },
        tracking: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        }
      }
    });
    
    // Get upcoming bookings
    const now = new Date();
    const upcomingBookings = await prisma.booking.findMany({
      where: { 
        userId: session.user.id,
        startTime: { gte: now }
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            provider: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });
    
    // Get favorite counts
    const [providerFavoritesCount, productFavoritesCount] = await Promise.all([
      prisma.favorite.count({
        where: {
          userId: session.user.id,
          providerId: { not: null }
        }
      }),
      prisma.favorite.count({
        where: {
          userId: session.user.id,
          productId: { not: null }
        }
      })
    ]);
    
    // Get total counts
    const [totalOrders, totalBookings] = await Promise.all([
      prisma.order.count({ where: { userId: session.user.id } }),
      prisma.booking.count({ where: { userId: session.user.id } })
    ]);
    
    // Format welcome message with user's name
    const welcomeMessage = messages.profile.dashboard.welcome.replace('{name}', user.name || '');
    
    return NextResponse.json({
      user,
      welcomeMessage,
      recentOrders,
      upcomingBookings,
      favorites: {
        providers: providerFavoritesCount,
        products: productFavoritesCount,
        total: providerFavoritesCount + productFavoritesCount
      },
      counts: {
        orders: totalOrders,
        bookings: totalBookings
      },
      messages: {
        recentOrders: messages.profile.dashboard.recentOrders,
        upcomingBookings: messages.profile.dashboard.upcomingBookings,
        viewAll: messages.profile.dashboard.viewAll,
        noOrders: messages.profile.dashboard.noOrders,
        noBookings: messages.profile.dashboard.noBookings,
        noFavorites: messages.profile.dashboard.noFavorites
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user dashboard' 
    }, { status: 500 });
  }
}