'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Badge } from '../ui';
import { Input } from '../ui';
import { Label } from '../ui';
import { Textarea } from '../ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Separator } from '../ui';
import { Star, MapPin, Clock, Users, Plus, Minus } from 'lucide-react';
import type { Service, Provider, SelectedService } from '../../types';

interface ServiceSelectorProps {
  services: Service[];
  providers: Provider[];
  selectedServices: SelectedService[];
  onServiceSelect: (service: SelectedService) => void;
  onServiceRemove: (serviceId: string) => void;
  onServiceUpdate: (serviceId: string, updates: Partial<SelectedService>) => void;
}

export function ServiceSelector({
  services,
  providers,
  selectedServices,
  onServiceSelect,
  onServiceRemove,
  onServiceUpdate
}: ServiceSelectorProps) {
  const [customizations, setCustomizations] = useState<Record<string, any>>({});

  const getProviderForService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return providers.find(p => p.id === service?.providerId);
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.serviceId === serviceId);
  };

  const getSelectedService = (serviceId: string) => {
    return selectedServices.find(s => s.serviceId === serviceId);
  };

  const handleServiceToggle = (service: Service) => {
    const provider = getProviderForService(service.id);
    if (!provider) return;

    if (isServiceSelected(service.id)) {
      onServiceRemove(service.id);
    } else {
      const selectedService: SelectedService = {
        serviceId: service.id,
        providerId: service.providerId,
        service,
        provider,
        quantity: 1,
        customizations: customizations[service.id] || {},
        dateTime: new Date(),
        duration: 2, // Default 2 hours
        price: service.basePrice
      };
      onServiceSelect(selectedService);
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    onServiceUpdate(serviceId, { 
      quantity, 
      price: service.basePrice * quantity 
    });
  };

  const handleCustomizationChange = (serviceId: string, key: string, value: any) => {
    const newCustomizations = {
      ...customizations,
      [serviceId]: {
        ...customizations[serviceId],
        [key]: value
      }
    };
    setCustomizations(newCustomizations);
    onServiceUpdate(serviceId, { customizations: newCustomizations[serviceId] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Services</h2>
        <p className="text-gray-600">Choose the services you need for your event</p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => {
          const provider = getProviderForService(service.id);
          const selected = isServiceSelected(service.id);
          const selectedService = getSelectedService(service.id);

          if (!provider) return null;

          return (
            <Card key={service.id} className={`transition-all ${selected ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>{provider.businessName}</span>
                      {provider.isVerified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{provider.rating}</span>
                        <span>({provider.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{provider.location.city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${service.basePrice}
                      <span className="text-sm font-normal text-gray-600">/{service.priceUnit}</span>
                    </div>
                    <Button
                      onClick={() => handleServiceToggle(service)}
                      variant={selected ? "destructive" : "default"}
                      size="sm"
                      className="mt-2"
                    >
                      {selected ? 'Remove' : 'Select'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700 mb-4">{service.description}</p>
                
                {service.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, index) => (
                        <Badge key={index} variant="outline">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selected && selectedService && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <h4 className="font-medium">Service Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`quantity-${service.id}`}>Quantity</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(service.id, selectedService.quantity - 1)}
                              disabled={selectedService.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              id={`quantity-${service.id}`}
                              type="number"
                              value={selectedService.quantity}
                              onChange={(e) => handleQuantityChange(service.id, parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                              min="1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(service.id, selectedService.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`duration-${service.id}`}>Duration (hours)</Label>
                          <Select
                            value={selectedService.duration.toString()}
                            onValueChange={(value) => onServiceUpdate(service.id, { duration: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="2">2 hours</SelectItem>
                              <SelectItem value="3">3 hours</SelectItem>
                              <SelectItem value="4">4 hours</SelectItem>
                              <SelectItem value="6">6 hours</SelectItem>
                              <SelectItem value="8">8 hours</SelectItem>
                              <SelectItem value="12">12 hours</SelectItem>
                              <SelectItem value="24">Full day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`special-requests-${service.id}`}>Special Requests</Label>
                        <Textarea
                          id={`special-requests-${service.id}`}
                          placeholder="Any special requirements or customizations..."
                          value={customizations[service.id]?.specialRequests || ''}
                          onChange={(e) => handleCustomizationChange(service.id, 'specialRequests', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total for this service:</span>
                          <span className="text-xl font-bold">${selectedService.price}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedServices.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-4">Selected Services Summary</h3>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div key={service.serviceId} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{service.service.name}</span>
                    <span className="text-gray-600 ml-2">x{service.quantity}</span>
                  </div>
                  <span className="font-medium">${service.price}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>${selectedServices.reduce((sum, service) => sum + service.price, 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}