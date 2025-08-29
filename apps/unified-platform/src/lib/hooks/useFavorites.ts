'use client';

import { useState, useEffect, useCallback } from 'react';
import { Favorite, FavoriteItem } from '@/types';
import { logger } from '../production-logger';

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  loading: boolean;
  error: string | null;
  addFavorite: (itemId: string, itemType: 'provider' | 'product') => Promise<void>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  isFavorite: (itemId: string, itemType: 'provider' | 'product') => boolean;
  toggleFavorite: (itemId: string, itemType: 'provider' | 'product') => Promise<void>;
}

export function useFavorites(userId?: string): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [userId]);

  // Listen for local storage changes (for non-authenticated users)
  useEffect(() => {
    if (!userId) {
      const handleStorageChange = () => {
        loadLocalFavorites();
      };

      window.addEventListener('favoritesChanged', handleStorageChange);
      return () => {
        window.removeEventListener('favoritesChanged', handleStorageChange);
      };
    }
  }, [userId]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      if (userId) {
        // Load from API for authenticated users
        const response = await fetch(`/api/favorites?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to load favorites');
        }
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        // Load from local storage for non-authenticated users
        await loadLocalFavorites();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFavorites = async () => {
    try {
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const favoriteItems: FavoriteItem[] = [];

      // Convert local storage format to FavoriteItem format
      for (const favoriteKey of localFavorites) {
        const [type, itemId] = favoriteKey.split('_');
        
        if (type === 'provider') {
          try {
            const response = await fetch(`/api/admin/providers/${itemId}`);
            if (response.ok) {
              const providerData = await response.json();
              
              // Get the lowest service price for this provider
              const servicesResponse = await fetch(`/api/services?providerId=${itemId}&limit=1&sortBy=price`);
              let basePrice = 0;
              if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json();
                basePrice = servicesData.services?.[0]?.basePrice || 0;
              }

              favoriteItems.push({
                id: favoriteKey,
                type: 'provider',
                name: providerData.name,
                description: providerData.description,
                images: [],
                rating: providerData.rating,
                reviewCount: providerData.reviewCount,
                basePrice,
                location: providerData.address,
                category: 'Service Provider',
                provider: {
                  id: providerData.id,
                  name: providerData.name,
                  isVerified: providerData.isVerified,
                },
                createdAt: new Date()
              });
            }
          } catch (error) {
            logger.error(`Failed to load provider ${itemId}:`, error);
          }
        } else if (type === 'product') {
          try {
            const response = await fetch(`/api/products/${itemId}`);
            if (response.ok) {
              const productData = await response.json();
              favoriteItems.push({
                id: favoriteKey,
                type: 'product',
                name: productData.name,
                description: productData.description,
                images: productData.images || [],
                rating: undefined,
                reviewCount: undefined,
                basePrice: productData.basePrice,
                location: undefined,
                category: productData.category,
                createdAt: new Date()
              });
            }
          } catch (error) {
            logger.error(`Failed to load product ${itemId}:`, error);
          }
        }
      }

      setFavorites(favoriteItems);
    } catch (err) {
      logger.error('Failed to load local favorites:', err);
      setFavorites([]);
    }
  };

  const addFavorite = useCallback(async (itemId: string, itemType: 'provider' | 'product') => {
    setError(null);

    try {
      if (userId) {
        // Add via API for authenticated users
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            itemId,
            itemType,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add favorite');
        }

        const newFavorite = await response.json();
        setFavorites(prev => [...prev, newFavorite]);
      } else {
        // Add to local storage for non-authenticated users
        const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoriteKey = `${itemType}_${itemId}`;
        
        if (!localFavorites.includes(favoriteKey)) {
          localFavorites.push(favoriteKey);
          localStorage.setItem('favorites', JSON.stringify(localFavorites));
          window.dispatchEvent(new CustomEvent('favoritesChanged'));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add favorite');
      throw err;
    }
  }, [userId]);

  const removeFavorite = useCallback(async (favoriteId: string) => {
    setError(null);

    try {
      if (userId) {
        // Remove via API for authenticated users
        const response = await fetch(`/api/favorites/${favoriteId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }

        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      } else {
        // Remove from local storage for non-authenticated users
        const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const updatedFavorites = localFavorites.filter((fav: string) => fav !== favoriteId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
      throw err;
    }
  }, [userId]);

  const clearFavorites = useCallback(async () => {
    setError(null);

    try {
      if (userId) {
        // Clear via API for authenticated users
        const response = await fetch(`/api/favorites?userId=${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to clear favorites');
        }

        setFavorites([]);
      } else {
        // Clear local storage for non-authenticated users
        localStorage.removeItem('favorites');
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear favorites');
      throw err;
    }
  }, [userId]);

  const isFavorite = useCallback((itemId: string, itemType: 'provider' | 'product') => {
    if (userId) {
      return favorites.some(fav => 
        (itemType === 'provider' && fav.type === 'provider' && fav.id.includes(itemId)) ||
        (itemType === 'product' && fav.type === 'product' && fav.id.includes(itemId))
      );
    } else {
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      return localFavorites.includes(`${itemType}_${itemId}`);
    }
  }, [favorites, userId]);

  const toggleFavorite = useCallback(async (itemId: string, itemType: 'provider' | 'product') => {
    if (isFavorite(itemId, itemType)) {
      const favorite = favorites.find(fav => 
        (itemType === 'provider' && fav.type === 'provider' && fav.id.includes(itemId)) ||
        (itemType === 'product' && fav.type === 'product' && fav.id.includes(itemId))
      );
      if (favorite) {
        await removeFavorite(favorite.id);
      } else if (!userId) {
        await removeFavorite(`${itemType}_${itemId}`);
      }
    } else {
      await addFavorite(itemId, itemType);
    }
  }, [favorites, isFavorite, addFavorite, removeFavorite, userId]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite,
    toggleFavorite,
  };
}

// Hook for syncing local favorites with user account on login
export function useFavoriteSync() {
  const syncLocalFavorites = useCallback(async (userId: string) => {
    try {
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (localFavorites.length === 0) {
        return;
      }

      // Send local favorites to server
      const response = await fetch('/api/favorites/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          localFavorites,
        }),
      });

      if (response.ok) {
        // Clear local storage after successful sync
        localStorage.removeItem('favorites');
        window.dispatchEvent(new CustomEvent('favoritesChanged'));
      }
    } catch (error) {
      logger.error('Failed to sync local favorites:', error);
    }
  }, []);

  return { syncLocalFavorites };
}
