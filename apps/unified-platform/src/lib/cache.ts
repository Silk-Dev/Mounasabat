import { unstable_cache } from 'next/cache';

// Cache configuration for different data types
export const CACHE_TAGS = {
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  PROVIDERS: 'providers',
  SERVICES: 'services',
  SEARCH_RESULTS: 'search-results',
  USER_PROFILE: 'user-profile',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
} as const;

export const CACHE_DURATIONS = {
  STATIC: 60 * 60 * 24 * 7, // 1 week for static data
  SEMI_STATIC: 60 * 60, // 1 hour for semi-static data
  DYNAMIC: 60 * 5, // 5 minutes for dynamic data
  USER_SPECIFIC: 60 * 30, // 30 minutes for user-specific data
  REAL_TIME: 0, // No cache for real-time data
} as const;

// Generic cache wrapper with automatic tagging
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    tags: string[];
    revalidate?: number;
    keyPrefix?: string;
  }
) {
  return unstable_cache(
    fn,
    options.keyPrefix ? [options.keyPrefix] : undefined,
    {
      tags: options.tags,
      revalidate: options.revalidate,
    }
  );
}

// Specific cache functions for common operations
export const getCachedCategories = createCachedFunction(
  async () => {
    const { prisma } = await import('./prisma');
    return prisma.category.findMany({
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
  },
  {
    tags: [CACHE_TAGS.CATEGORIES],
    revalidate: CACHE_DURATIONS.STATIC,
    keyPrefix: 'categories-all'
  }
);

export const getCachedLocations = createCachedFunction(
  async () => {
    const { prisma } = await import('./prisma');
    return prisma.provider.findMany({
      select: {
        location: true,
        city: true,
        region: true,
      },
      distinct: ['city', 'region'],
    });
  },
  {
    tags: [CACHE_TAGS.LOCATIONS],
    revalidate: CACHE_DURATIONS.STATIC,
    keyPrefix: 'locations-all'
  }
);

export const getCachedProvider = (providerId: string) =>
  createCachedFunction(
    async (id: string) => {
      const { prisma } = await import('./prisma');
      return prisma.provider.findUnique({
        where: { id },
        include: {
          services: {
            include: {
              category: true,
              reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                  user: {
                    select: { name: true, avatar: true }
                  }
                }
              }
            }
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, avatar: true }
              }
            }
          },
          _count: {
            select: { services: true, reviews: true, bookings: true }
          }
        }
      });
    },
    {
      tags: [CACHE_TAGS.PROVIDERS, `provider-${providerId}`],
      revalidate: CACHE_DURATIONS.SEMI_STATIC,
      keyPrefix: `provider-${providerId}`
    }
  )(providerId);

export const getCachedSearchResults = (searchParams: string) =>
  createCachedFunction(
    async (params: string) => {
      const { searchServices } = await import('./search');
      const parsedParams = JSON.parse(params);
      return searchServices(parsedParams);
    },
    {
      tags: [CACHE_TAGS.SEARCH_RESULTS],
      revalidate: CACHE_DURATIONS.DYNAMIC,
      keyPrefix: `search-${Buffer.from(searchParams).toString('base64').slice(0, 20)}`
    }
  )(searchParams);

export const getCachedUserProfile = (userId: string) =>
  createCachedFunction(
    async (id: string) => {
      const { prisma } = await import('./prisma');
      return prisma.user.findUnique({
        where: { id },
        include: {
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              service: {
                include: {
                  provider: {
                    select: { name: true, avatar: true }
                  }
                }
              }
            }
          },
          favorites: {
            include: {
              service: {
                include: {
                  provider: {
                    select: { name: true, avatar: true }
                  }
                }
              }
            }
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              service: {
                include: {
                  provider: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      });
    },
    {
      tags: [CACHE_TAGS.USER_PROFILE, `user-${userId}`],
      revalidate: CACHE_DURATIONS.USER_SPECIFIC,
      keyPrefix: `user-profile-${userId}`
    }
  )(userId);

// Cache invalidation helpers
export async function revalidateCache(tags: string[]) {
  const { revalidateTag } = await import('next/cache');
  tags.forEach(tag => revalidateTag(tag));
}

export async function revalidateUserCache(userId: string) {
  await revalidateCache([
    CACHE_TAGS.USER_PROFILE,
    `user-${userId}`,
    CACHE_TAGS.BOOKINGS,
    CACHE_TAGS.FAVORITES,
    CACHE_TAGS.REVIEWS
  ]);
}

export async function revalidateProviderCache(providerId: string) {
  await revalidateCache([
    CACHE_TAGS.PROVIDERS,
    `provider-${providerId}`,
    CACHE_TAGS.SERVICES,
    CACHE_TAGS.SEARCH_RESULTS
  ]);
}

// Memory cache for frequently accessed data (client-side)
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 100;

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();
