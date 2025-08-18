'use client';

import React, { useState } from 'react';
import { X, Star, MapPin, Phone, Mail, Globe, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComparisonItem } from '@/types';

interface ComparisonViewProps {
  items: ComparisonItem[];
  onRemoveItem: (itemId: string) => void;
  onClose: () => void;
}

export function ComparisonView({ items, onRemoveItem, onClose }: ComparisonViewProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  // Get all unique features across all items
  const allFeatures = Array.from(
    new Set(items.flatMap(item => item.features || []))
  );

  const getFeatureValue = (item: ComparisonItem, feature: string) => {
    return item.features?.includes(feature);
  };

  const getBestValue = (field: keyof ComparisonItem, type: 'min' | 'max' = 'max') => {
    const values = items.map(item => {
      const value = item[field];
      return typeof value === 'number' ? value : 0;
    });
    
    return type === 'max' ? Math.max(...values) : Math.min(...values);
  };

  const isHighlighted = (item: ComparisonItem, field: keyof ComparisonItem, type: 'min' | 'max' = 'max') => {
    const value = item[field];
    if (typeof value !== 'number') return false;
    
    const bestValue = getBestValue(field, type);
    return value === bestValue;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Compare Favorites</h2>
              <p className="text-gray-600">Compare up to 4 items side by side</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
              
              {/* Header Row */}
              <div className="font-medium text-gray-900">Items</div>
              {items.map((item) => (
                <Card key={item.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={item.images[0] || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.name}</h3>
                    <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                    
                    {item.provider && (
                      <div className="text-sm text-gray-600 mb-2">
                        by {item.provider.name}
                        {item.provider.isVerified && (
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Rating Row */}
              <div className="font-medium text-gray-700 py-3">Rating</div>
              {items.map((item) => (
                <div key={`rating-${item.id}`} className="py-3">
                  {item.rating ? (
                    <div className={`flex items-center gap-1 ${
                      isHighlighted(item, 'rating') ? 'text-green-600 font-semibold' : ''
                    }`}>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}</span>
                      <span className="text-gray-500">({item.reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No rating</span>
                  )}
                </div>
              ))}

              <Separator className="col-span-full" />

              {/* Price Row */}
              <div className="font-medium text-gray-700 py-3">Starting Price</div>
              {items.map((item) => (
                <div key={`price-${item.id}`} className="py-3">
                  <div className={`text-lg font-bold ${
                    isHighlighted(item, 'basePrice', 'min') ? 'text-green-600' : 'text-primary'
                  }`}>
                    ${item.basePrice}
                  </div>
                  {item.pricing?.priceUnit && (
                    <div className="text-sm text-gray-500">
                      {item.pricing.priceUnit}
                    </div>
                  )}
                  {item.pricing?.additionalFees && item.pricing.additionalFees.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      + additional fees
                    </div>
                  )}
                </div>
              ))}

              <Separator className="col-span-full" />

              {/* Location Row */}
              <div className="font-medium text-gray-700 py-3">Location</div>
              {items.map((item) => (
                <div key={`location-${item.id}`} className="py-3">
                  {item.location ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{item.location}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </div>
              ))}

              <Separator className="col-span-full" />

              {/* Availability Row */}
              <div className="font-medium text-gray-700 py-3">Availability</div>
              {items.map((item) => (
                <div key={`availability-${item.id}`} className="py-3">
                  <Badge variant={item.availability ? 'default' : 'secondary'}>
                    {item.availability ? 'Available' : 'Check availability'}
                  </Badge>
                </div>
              ))}

              <Separator className="col-span-full" />

              {/* Contact Information */}
              <div className="font-medium text-gray-700 py-3">Contact</div>
              {items.map((item) => (
                <div key={`contact-${item.id}`} className="py-3 space-y-2">
                  {item.contactInfo?.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span>{item.contactInfo.email}</span>
                    </div>
                  )}
                  {item.contactInfo?.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{item.contactInfo.phone}</span>
                    </div>
                  )}
                  {item.contactInfo?.website && (
                    <div className="flex items-center gap-1 text-sm">
                      <Globe className="h-3 w-3 text-gray-400" />
                      <span className="truncate">{item.contactInfo.website}</span>
                    </div>
                  )}
                  {!item.contactInfo?.email && !item.contactInfo?.phone && !item.contactInfo?.website && (
                    <span className="text-gray-400 text-sm">Contact via platform</span>
                  )}
                </div>
              ))}

              {/* Features Section */}
              {allFeatures.length > 0 && (
                <>
                  <Separator className="col-span-full" />
                  
                  <div className="font-medium text-gray-700 py-3">Features</div>
                  {items.map((item) => (
                    <div key={`features-header-${item.id}`} className="py-3">
                      <div className="text-sm text-gray-600">
                        {item.features?.length || 0} features
                      </div>
                    </div>
                  ))}

                  {/* Individual Features */}
                  {allFeatures.map((feature) => (
                    <React.Fragment key={feature}>
                      <div className="text-sm text-gray-600 py-2 pl-4">
                        {feature}
                      </div>
                      {items.map((item) => (
                        <div key={`${feature}-${item.id}`} className="py-2 text-center">
                          {getFeatureValue(item, feature) ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            {items.map((item) => (
              <Button key={`action-${item.id}`} className="flex-1 max-w-xs">
                View Details
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified comparison card for mobile view
export function MobileComparisonView({ items, onRemoveItem, onClose }: ComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Compare Items</h2>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-1 mt-3">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-1 h-2 rounded ${
                  index === currentIndex ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`${index === currentIndex ? 'block' : 'hidden'}`}
            >
              <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                <img
                  src={item.images[0] || '/placeholder-image.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
              <Badge variant="secondary" className="mb-4">{item.category}</Badge>
              
              <div className="space-y-3">
                {item.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating} ({item.reviewCount})</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-primary">${item.basePrice}</span>
                </div>
                
                {item.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-sm">{item.location}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <Badge variant={item.availability ? 'default' : 'secondary'}>
                    {item.availability ? 'Available' : 'Check'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button className="flex-1">View Details</Button>
                <Button
                  variant="outline"
                  onClick={() => onRemoveItem(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}