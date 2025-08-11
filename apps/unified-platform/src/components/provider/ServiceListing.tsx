'use client';

import React, { useState } from 'react';
import { Service, Package } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Star, Clock, MapPin, Package as PackageIcon, Calendar } from 'lucide-react';
import Image from 'next/image';

interface ServiceListingProps {
  services: Service[];
  packages: Package[];
  providerId: string;
  className?: string;
}

const ServiceListing: React.FC<ServiceListingProps> = ({ 
  services, 
  packages, 
  providerId, 
  className = '' 
}) => {
  const [selectedTab, setSelectedTab] = useState('services');

  const formatPrice = (price: number, unit?: string) => {
    const formattedPrice = new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

    return unit ? `${formattedPrice} ${unit}` : formattedPrice;
  };

  const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row">
        {/* Service Image */}
        {service.images && service.images.length > 0 && (
          <div className="relative w-full sm:w-48 h-48 sm:h-auto">
            <Image
              src={service.images[0]}
              alt={service.name}
              fill
              className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
              sizes="(max-width: 640px) 100vw, 192px"
              loading="lazy"
            />
          </div>
        )}

        {/* Service Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {service.name}
              </h3>
              <Badge variant="secondary" className="mb-2">
                {service.category}
              </Badge>
            </div>
            {service.basePrice && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(service.basePrice, service.priceUnit)}
                </div>
                {service.pricingType === 'QUOTE' && (
                  <div className="text-sm text-gray-500">Starting from</div>
                )}
              </div>
            )}
          </div>

          {service.description && (
            <p className="text-gray-600 mb-4 line-clamp-3">
              {service.description}
            </p>
          )}

          {/* Service Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            {service.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{service.location}</span>
              </div>
            )}
            {service.pricingType && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.pricingType === 'FIXED' ? 'Fixed Price' : 'Quote Required'}</span>
              </div>
            )}
          </div>

          {/* Coverage Areas */}
          {service.coverageArea && service.coverageArea.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Service Areas:</div>
              <div className="flex flex-wrap gap-1">
                {service.coverageArea.slice(0, 3).map((area, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {service.coverageArea.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{service.coverageArea.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none">
              <Calendar className="w-4 h-4 mr-2" />
              Book Now
            </Button>
            <Button variant="outline">
              Get Quote
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  const PackageCard: React.FC<{ pkg: Package }> = ({ pkg }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              {pkg.name}
            </CardTitle>
            {pkg.description && (
              <p className="text-gray-600 mt-2">{pkg.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(pkg.totalPrice)}
            </div>
            {pkg.discount && (
              <div className="text-sm text-green-600">
                Save {pkg.discount}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Package Items */}
        {pkg.items && pkg.items.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Included Services:</h4>
            <div className="space-y-2">
              {pkg.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium">{item.service.name}</div>
                    <div className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(item.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 mr-2" />
            Book Package
          </Button>
          <Button variant="outline">
            Customize
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="packages">
            Packages ({packages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          {services.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                <div className="text-sm text-gray-500">
                  {services.length} service{services.length !== 1 ? 's' : ''} available
                </div>
              </div>
              
              <div className="space-y-4">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No services available</div>
              <div className="text-sm text-gray-400">
                This provider hasn't added any services yet.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages" className="mt-6">
          {packages.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Packages</h2>
                <div className="text-sm text-gray-500">
                  {packages.length} package{packages.length !== 1 ? 's' : ''} available
                </div>
              </div>
              
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No packages available</div>
              <div className="text-sm text-gray-400">
                This provider hasn't created any packages yet.
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceListing;