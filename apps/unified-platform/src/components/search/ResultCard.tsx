'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { 
  Star, 
  MapPin, 
  Verified, 
  Heart,
  Share2,
  Eye,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import type { SearchResult } from '@/types';

interface ResultCardProps {
  result: SearchResult;
  viewMode?: 'grid' | 'list';
  onFavoriteToggle?: (id: string) => void;
  onShare?: (result: SearchResult) => void;
  isFavorited?: boolean;
  className?: string;
}

export default function ResultCard({
  result,
  viewMode = 'grid',
  onFavoriteToggle,
  onShare,
  isFavorited = false,
  className = ''
}: ResultCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCardClick = () => {
    router.push(`/providers/${result.provider.id}/services/${result.id}`);
  };

  const handleProviderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/providers/${result.provider.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(result.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(result);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : i < rating 
            ? 'fill-yellow-200 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="text-center">
        <Eye className="h-8 w-8 mx-auto mb-2" />
        <span className="text-sm">No image available</span>
      </div>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <Card 
        className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex">
          {/* Image Section */}
          <div className="w-48 h-32 flex-shrink-0 relative">
            {result.images[0] && !imageError ? (
              <img
                src={result.images[0]}
                alt={result.name}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <ImagePlaceholder />
            )}
            
            {/* Price Badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-white/90 text-gray-900 font-semibold">
                {formatPrice(result.basePrice)}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFavoriteClick}
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} 
                />
              </Button>
              {onShare && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShareClick}
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                >
                  <Share2 className="h-4 w-4 text-gray-600" />
                </Button>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {result.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {renderStars(result.rating)}
                    <span className="text-sm font-medium text-gray-700">{result.rating}</span>
                    <span className="text-sm text-gray-500">({result.reviewCount} reviews)</span>
                  </div>
                  {result.provider.isVerified && (
                    <Verified className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {result.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {result.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Available
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleProviderClick}
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  by {result.provider.name}
                </button>
                <Button size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="aspect-video relative">
        {result.images[0] && !imageError ? (
          <img
            src={result.images[0]}
            alt={result.name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder />
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-900 font-semibold">
            {formatPrice(result.basePrice)}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFavoriteClick}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
          >
            <Heart 
              className={`h-4 w-4 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`} 
            />
          </Button>
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShareClick}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </Button>
          )}
        </div>

        {/* Service Type Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="bg-white/90 text-xs">
            {result.type === 'service' ? 'Service' : 'Provider'}
          </Badge>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
            {result.name}
          </h3>
          <div className="flex items-center gap-1 text-sm ml-2">
            {renderStars(result.rating)}
            <span className="font-medium text-gray-700">{result.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <span>({result.reviewCount} reviews)</span>
          {result.provider.isVerified && (
            <>
              <span>•</span>
              <Verified className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600">Verified</span>
            </>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {result.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            {result.location}
          </div>
          
          <Button
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View Details
          </Button>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleProviderClick}
            className="text-xs text-gray-500 hover:text-primary transition-colors"
          >
            by {result.provider.name}
          </button>
        </div>
      </div>
    </Card>
  );
}