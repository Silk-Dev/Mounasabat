'use client';

import React from 'react';
import { Provider } from '@/types';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MapPin, Phone, Mail, Globe, Star, Shield } from 'lucide-react';
import ImageGallery from './ImageGallery';
import ServiceListing from './ServiceListing';
import ReviewSection from './ReviewSection';
import AvailabilityCalendar from './AvailabilityCalendar';

interface ProviderProfileProps {
  provider: Provider;
  className?: string;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({ provider, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Provider Images */}
            <div className="lg:w-1/2">
              <ImageGallery images={provider.images} alt={provider.businessName} />
            </div>

            {/* Provider Info */}
            <div className="lg:w-1/2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {provider.businessName}
                  </h1>
                  <div className="flex items-center gap-2 mb-3">
                    {provider.isVerified && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {provider.description}
              </p>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.location.address}, {provider.location.city}</span>
                </div>
                
                {provider.phoneNumber && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{provider.phoneNumber}</span>
                  </div>
                )}
                
                {provider.contactEmail && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{provider.contactEmail}</span>
                  </div>
                )}
                
                {provider.website && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Coverage Areas */}
              {provider.coverageAreas.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Service Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.coverageAreas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Services and Packages */}
        <div className="lg:col-span-2 space-y-8">
          <ServiceListing 
            services={provider.services} 
            packages={provider.packages || []}
            providerId={provider.id}
          />
          
          {provider.reviews && provider.reviews.length > 0 && (
            <ReviewSection 
              reviews={provider.reviews} 
              averageRating={provider.rating}
              totalReviews={provider.reviewCount}
            />
          )}
        </div>

        {/* Right Column - Availability */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Check Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityCalendar providerId={provider.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;