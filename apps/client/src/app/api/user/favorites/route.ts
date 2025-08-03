import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';
import { z } from 'zod';
import { detectLanguage, getUserProfileMessages, type Language } from '@mounasabet/utils';

const prisma = new PrismaClient();

// Schema for favorite creation validation
const favoriteCreateSchema = z.object({
  providerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
}).refine(data => data.providerId || data.productId, {
  message: "Either providerId or productId must be provided",
});

// Get user favorites
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'all'; // 'provider', 'product', or 'all'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'date'; // 'date', 'name', 'rating'
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      userId: session.user.id,
    };
    
    if (type === 'provider') {
      where.providerId = { not: null };
    } else if (type === 'product') {
      where.productId = { not: null };
    }
    
    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name') {
      // We need to sort by the related entity's name
      // This is handled in memory after fetching since Prisma doesn't support this directly
    } else if (sortBy === 'rating') {
      // Also handled in memory for providers
    }
    
    // Get favorites with count
    const [favorites, totalCount] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          provider: type !== 'product' ? {
            select: {
              id: true,
              name: true,
              description: true,
              rating: true,
              reviewCount: true,
              location: true,
              coverImage: true,
              serviceOfferings: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  basePrice: true,
                },
                take: 3,
              }
            }
          } : false,
          product: type !== 'provider' ? {
            select: {
              id: true,
              name: true,
              description: true,
              basePrice: true,
              category: true,
              images: true,
              rating: true,
              reviewCount: true,
              inStock: true,
            }
          } : false,
        },
      }),
      prisma.favorite.count({ where }),
    ]);
    
    // Sort in memory if needed
    let sortedFavorites = [...favorites];
    if (sortBy === 'name') {
      sortedFavorites.sort((a, b) => {
        const nameA = a.provider?.name || a.product?.name || '';
        const nameB = b.provider?.name || b.product?.name || '';
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'rating') {
      sortedFavorites.sort((a, b) => {
        const ratingA = a.provider?.rating || a.product?.rating || 0;
        const ratingB = b.provider?.rating || b.product?.rating || 0;
        return ratingB - ratingA; // Descending order
      });
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      favorites: sortedFavorites,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      messages: {
        providers: messages.favorites.providers,
        products: messages.favorites.products,
        empty: messages.favorites.empty,
        filter: messages.favorites.filter,
      }
    });
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch user favorites' }, { status: 500 });
  }
}

// Add a favorite
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user language preference or detect from request
    const userLanguage = (session.user.language as Language) || 
      detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(userLanguage);
    
    const data = await req.json();
    
    // Validate input data
    const validationResult = favoriteCreateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { providerId, productId } = validationResult.data;
    
    // Check if the provider or product exists
    if (providerId) {
      const provider = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
    }
    
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
    }
    
    // Check if favorite already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        ...(providerId ? { providerId } : {}),
        ...(productId ? { productId } : {}),
      },
    });
    
    if (existingFavorite) {
      return NextResponse.json({ 
        error: messages.favorites.alreadyExists 
      }, { status: 409 });
    }
    
    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        ...(providerId ? { providerId } : {}),
        ...(productId ? { productId } : {}),
      },
      include: {
        provider: providerId ? {
          select: {
            id: true,
            name: true,
          }
        } : false,
        product: productId ? {
          select: {
            id: true,
            name: true,
          }
        } : false,
      }
    });
    
    return NextResponse.json({
      favorite,
      message: messages.favorites.added
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    
    // Get language from request headers as fallback
    const language = detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(language);
    
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}