'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Grid, List, GitCompare, Trash2, Star, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { FavoriteItem, ComparisonItem } from '@/types';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { toast } from 'sonner';

interface FavoritesProps {
  userId?: string;
}

export function Favorites({ userId }: FavoritesProps) {
  const { favorites, loading, removeFavorite, clearFavorites } = useFavorites(userId);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId);
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const handleCompare = () => {
    if (selectedItems.length < 2) {
      toast.error('Please select at least 2 items to compare');
      return;
    }
    if (selectedItems.length > 4) {
      toast.error('You can compare up to 4 items at once');
      return;
    }
    setShowComparison(true);
  };

  const providers = favorites.filter(item => item.type === 'provider');
  const products = favorites.filter(item => item.type === 'product');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-gray-500 mb-4">
          Start exploring services and providers to add them to your favorites
        </p>
        <Button>
          Browse Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
          <p className="text-gray-600">{favorites.length} saved items</p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCompare}
                disabled={selectedItems.length < 2}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare ({selectedItems.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </>
          )}
          
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for different types */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({favorites.length})</TabsTrigger>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <FavoritesList
            items={favorites}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onRemove={handleRemoveFavorite}
          />
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <FavoritesList
            items={providers}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onRemove={handleRemoveFavorite}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <FavoritesList
            items={products}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onRemove={handleRemoveFavorite}
          />
        </TabsContent>
      </Tabs>

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          items={favorites.filter(item => selectedItems.includes(item.id))}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}

interface FavoritesListProps {
  items: FavoriteItem[];
  viewMode: 'grid' | 'list';
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onRemove: (favoriteId: string) => void;
}

function FavoritesList({ items, viewMode, selectedItems, onSelectItem, onRemove }: FavoritesListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No items in this category</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <FavoriteCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={() => onSelectItem(item.id)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FavoriteListItem
          key={item.id}
          item={item}
          isSelected={selectedItems.includes(item.id)}
          onSelect={() => onSelectItem(item.id)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </div>
  );
}

interface FavoriteCardProps {
  item: FavoriteItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function FavoriteCard({ item, isSelected, onSelect, onRemove }: FavoriteCardProps) {
  return (
    <Card className={`relative transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="bg-white"
        />
      </div>
      
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={item.images[0] || '/placeholder-image.jpg'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
          <Badge variant="secondary">{item.category}</Badge>
        </div>

        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-4 mb-3">
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{item.rating}</span>
              <span className="text-sm text-gray-500">({item.reviewCount})</span>
            </div>
          )}
          
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">{item.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              ${item.basePrice}
            </span>
            {item.type === 'provider' && (
              <span className="text-sm text-gray-500 ml-1">starting from</span>
            )}
          </div>
          
          {item.provider?.isVerified && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Verified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FavoriteListItemProps {
  item: FavoriteItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function FavoriteListItem({ item, isSelected, onSelect, onRemove }: FavoriteListItemProps) {
  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
          />
          
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={item.images[0] || '/placeholder-image.jpg'}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">{item.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                {item.provider?.isVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {item.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-6 mb-2">
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{item.rating}</span>
                  <span className="text-sm text-gray-500">({item.reviewCount})</span>
                </div>
              )}
              
              {item.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{item.location}</span>
                </div>
              )}

              <div>
                <span className="text-lg font-bold text-primary">
                  ${item.basePrice}
                </span>
                {item.type === 'provider' && (
                  <span className="text-sm text-gray-500 ml-1">starting from</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonModalProps {
  items: FavoriteItem[];
  onClose: () => void;
}

function ComparisonModal({ items, onClose }: ComparisonModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Compare Favorites</h2>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ComparisonCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonCardProps {
  item: FavoriteItem;
}

function ComparisonCard({ item }: ComparisonCardProps) {
  return (
    <Card>
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={item.images[0] || '/placeholder-image.jpg'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{item.name}</h3>
        <Badge variant="secondary" className="mb-3">{item.category}</Badge>
        
        <div className="space-y-2 text-sm">
          {item.rating && (
            <div className="flex items-center justify-between">
              <span>Rating:</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{item.rating} ({item.reviewCount})</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span>Price:</span>
            <span className="font-semibold">${item.basePrice}</span>
          </div>
          
          {item.location && (
            <div className="flex items-center justify-between">
              <span>Location:</span>
              <span className="truncate ml-2">{item.location}</span>
            </div>
          )}
          
          {item.provider?.isVerified && (
            <div className="flex items-center justify-between">
              <span>Verified:</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Yes
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}