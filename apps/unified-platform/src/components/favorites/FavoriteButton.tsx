'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'provider' | 'product';
  userId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
}

export function FavoriteButton({
  itemId,
  itemType,
  userId,
  className = '',
  size = 'md',
  variant = 'ghost',
  showText = false
}: FavoriteButtonProps) {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites(userId);
  const [isLoading, setIsLoading] = useState(false);
  
  const isFav = isFavorite(itemId, itemType);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      // Handle non-authenticated users with local storage
      handleLocalStorageFavorite();
      return;
    }

    setIsLoading(true);
    
    try {
      if (isFav) {
        const favorite = favorites.find(f => 
          (itemType === 'provider' && f.providerId === itemId) ||
          (itemType === 'product' && f.productId === itemId)
        );
        if (favorite) {
          await removeFavorite(favorite.id);
          toast.success('Removed from favorites');
        }
      } else {
        await addFavorite(itemId, itemType);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalStorageFavorite = () => {
    const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteKey = `${itemType}_${itemId}`;
    
    if (localFavorites.includes(favoriteKey)) {
      const updatedFavorites = localFavorites.filter((fav: string) => fav !== favoriteKey);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      toast.success('Removed from favorites');
    } else {
      localFavorites.push(favoriteKey);
      localStorage.setItem('favorites', JSON.stringify(localFavorites));
      toast.success('Added to favorites');
    }
    
    // Trigger a custom event to update other components
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  return (
    <Button
      variant={variant}
      size={showText ? 'sm' : 'icon'}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`${!showText ? getButtonSize() : ''} ${className}`}
    >
      <Heart
        className={`${getIconSize()} transition-colors ${
          isFav 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
      {showText && (
        <span className="ml-2">
          {isFav ? 'Remove from favorites' : 'Add to favorites'}
        </span>
      )}
    </Button>
  );
}

// Hook for checking if item is in local storage favorites (for non-authenticated users)
export function useLocalFavorites() {
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  React.useEffect(() => {
    const updateLocalFavorites = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setLocalFavorites(favorites);
    };

    updateLocalFavorites();
    window.addEventListener('favoritesChanged', updateLocalFavorites);
    
    return () => {
      window.removeEventListener('favoritesChanged', updateLocalFavorites);
    };
  }, []);

  const isLocalFavorite = (itemId: string, itemType: 'provider' | 'product') => {
    return localFavorites.includes(`${itemType}_${itemId}`);
  };

  return { localFavorites, isLocalFavorite };
}