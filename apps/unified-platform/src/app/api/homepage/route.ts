import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';

export async function GET() {
  try {
    logger.info('Fetching homepage data');

    // Fetch services with their providers and reviews
    const [services, popularLocations] = await Promise.all([
      // Get 24 featured/popular services across different categories
      prisma.service.findMany({
        where: {
          isActive: true,
          provider: {
            isVerified: true,
          },
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              rating: true,
              reviewCount: true,
              isVerified: true,
              location: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
            take: 100, // Limit for performance
          },
        },
        orderBy: [
          { provider: { rating: 'desc' } },
          { createdAt: 'desc' },
        ],
        take: 24,
      }),

      // Get popular locations
      prisma.service.groupBy({
        by: ['location'],
        where: {
          location: {
            not: null,
          },
          isActive: true,
          provider: {
            isVerified: true,
          },
        },
        _count: {
          location: true,
        },
        orderBy: {
          _count: {
            location: 'desc',
          },
        },
        take: 16,
      }),
    ]);

    // Transform services data
    const transformedServices = services.map(service => {
      // Calculate average rating from reviews
      const avgRating = service.reviews.length > 0
        ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
        : service.provider.rating || 0;

      // Determine price unit based on category
      let priceUnit = '/event';
      if (service.category?.toLowerCase().includes('catering') || 
          service.category?.toLowerCase().includes('traiteur')) {
        priceUnit = '/pers';
      } else if (service.category?.toLowerCase().includes('location') || 
                 service.category?.toLowerCase().includes('equipment')) {
        priceUnit = '/jour';
      }

      // Get a representative image or use a placeholder
      const image = service.images && service.images.length > 0 
        ? service.images[0] 
        : '/placeholder-service.jpg';

      return {
        id: service.id,
        name: service.name,
        location: service.location || service.provider.location || 'Non spécifié',
        price: service.basePrice?.toString() || '0',
        rating: Math.round(avgRating * 10) / 10,
        reviews: service.reviews.length,
        image: image,
        type: service.category || 'Service',
        category: getCategoryType(service.category),
      };
    });

    // Transform popular locations
    const transformedLocations = await Promise.all(
      popularLocations.map(async (locationData) => {
        if (!locationData.location) return null;
        
        // Get count of services in this location
        const serviceCount = await prisma.service.count({
          where: {
            location: locationData.location,
            isActive: true,
            provider: {
              isVerified: true,
            },
          },
        });

        return {
          name: locationData.location,
          image: getLocationImage(locationData.location),
          count: `${serviceCount} services`,
        };
      })
    );

    // Filter out null locations
    const validLocations = transformedLocations.filter(Boolean);


    return NextResponse.json({
      success: true,
      data: {
        services: transformedServices,
        popularDestinations: validLocations,
      },
    });

  } catch (error) {
    logger.error('Failed to fetch homepage data:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch homepage data',
        data: {
          services: [],
          popularDestinations: [],
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to map service categories to frontend categories
function getCategoryType(category: string | null): string {
  if (!category) return 'other';
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('venue') || categoryLower.includes('lieu') || categoryLower.includes('salle')) {
    return 'venue';
  }
  if (categoryLower.includes('photo') || categoryLower.includes('video')) {
    return 'photographer';
  }
  if (categoryLower.includes('catering') || categoryLower.includes('traiteur') || categoryLower.includes('food')) {
    return 'catering';
  }
  if (categoryLower.includes('music') || categoryLower.includes('dj') || categoryLower.includes('orchestre')) {
    return 'music';
  }
  if (categoryLower.includes('decoration') || categoryLower.includes('fleur') || categoryLower.includes('decor')) {
    return 'decoration';
  }
  if (categoryLower.includes('equipment') || categoryLower.includes('location') || categoryLower.includes('material')) {
    return 'equipment';
  }
  if (categoryLower.includes('beauty') || categoryLower.includes('makeup') || categoryLower.includes('maquillage')) {
    return 'beauty';
  }
  if (categoryLower.includes('transport') || categoryLower.includes('car') || categoryLower.includes('voiture')) {
    return 'transport';
  }
  
  return 'other';
}

// Helper function to get location images
function getLocationImage(location: string): string {
  const locationImages: Record<string, string> = {
    'Casablanca': '/aab.jpg',
    'Marrakech': '/aan.jpg',
    'Rabat': '/back.jpg',
    'Fès': '/image2.jpg',
    'Tanger': '/immg.png',
    'Agadir': '/image33.jpg',
    'Meknès': '/Ambiance élégant.jpg',
    'Oujda': '/Ambiance moderne.jpg',
    'Tétouan': '/Ambiance naturel.jpg',
    'Kénitra': '/Ambiance vintage.jpg',
    'Safi': '/Anniversaire festif.jpg',
    'El Jadida': '/Beauté Pure.jpg',
    'Larache': '/Bohème & Coloré.jpg',
    'Essaouira': '/beautiful-luxurious-wedding-ceremony-hall.jpg',
    'Chefchaouen': '/Cartes & Co.jpg',
    'Ouarzazate': '/Conférence professionnelle.jpg',
  };

  return locationImages[location] || '/back.jpg'; // Default image
}