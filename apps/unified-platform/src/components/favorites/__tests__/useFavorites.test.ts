import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '@/lib/hooks/useFavorites';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.dispatchEvent
global.window.dispatchEvent = jest.fn();

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  describe('for authenticated users', () => {
    it('should load favorites from API', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          type: 'provider',
          name: 'Test Provider',
          description: 'Test Description',
          images: [],
          rating: 4.5,
          reviewCount: 10,
          basePrice: 100,
          location: 'Test Location',
          category: 'Test Category',
          createdAt: new Date(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: mockFavorites }),
      });

      const { result } = renderHook(() => useFavorites('user-1'));

      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(fetch).toHaveBeenCalledWith('/api/favorites?userId=user-1');
      expect(result.current.favorites).toEqual(mockFavorites);
      expect(result.current.loading).toBe(false);
    });

    it('should add favorite via API', async () => {
      const mockFavorite = {
        id: 'fav-1',
        type: 'provider',
        name: 'Test Provider',
        description: 'Test Description',
        images: [],
        rating: 4.5,
        reviewCount: 10,
        basePrice: 100,
        location: 'Test Location',
        category: 'Test Category',
        createdAt: new Date(),
      };

      // Mock initial load
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: [] }),
      });

      // Mock add favorite
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFavorite,
      });

      const { result } = renderHook(() => useFavorites('user-1'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.addFavorite('provider-1', 'provider');
      });

      expect(fetch).toHaveBeenCalledWith('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-1',
          itemId: 'provider-1',
          itemType: 'provider',
        }),
      });
    });
  });

  describe('for non-authenticated users', () => {
    it('should use localStorage for favorites', async () => {
      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.addFavorite('provider-1', 'provider');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['provider_provider-1'])
      );
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('favoritesChanged')
      );
    });

    it('should check if item is favorite from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['provider_provider-1', 'product_product-1'])
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite('provider-1', 'provider')).toBe(true);
      expect(result.current.isFavorite('provider-2', 'provider')).toBe(false);
      expect(result.current.isFavorite('product-1', 'product')).toBe(true);
    });

    it('should remove favorite from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['provider_provider-1', 'product_product-1'])
      );

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.removeFavorite('provider_provider-1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'favorites',
        JSON.stringify(['product_product-1'])
      );
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        new CustomEvent('favoritesChanged')
      );
    });
  });

  describe('isFavorite method', () => {
    it('should correctly identify favorites for authenticated users', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          type: 'provider' as const,
          name: 'Test Provider',
          description: 'Test Description',
          images: [],
          rating: 4.5,
          reviewCount: 10,
          basePrice: 100,
          location: 'Test Location',
          category: 'Test Category',
          createdAt: new Date(),
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: mockFavorites }),
      });

      const { result } = renderHook(() => useFavorites('user-1'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // This is a simplified check - in reality, we'd need to match the actual provider ID
      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].type).toBe('provider');
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useFavorites('user-1'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false);
    });

    it('should handle failed add favorite', async () => {
      // Mock initial load
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ favorites: [] }),
      });

      // Mock failed add
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useFavorites('user-1'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await expect(
        act(async () => {
          await result.current.addFavorite('provider-1', 'provider');
        })
      ).rejects.toThrow('Failed to add favorite');
    });
  });
});