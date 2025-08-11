'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Input } from '../ui';
import { Label } from '../ui';
import { Textarea } from '../ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Checkbox } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { User, Mail, Phone, MapPin, Users, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import type { CustomerInfo, EventDetails } from '../../types';
import { z } from 'zod';

interface CustomerFormProps {
  customerInfo: CustomerInfo;
  eventDetails: EventDetails;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  onEventDetailsChange: (details: EventDetails) => void;
  onValidationChange: (isValid: boolean) => void;
}

// Validation schemas
const customerInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number'),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    country: z.string().min(2, 'Please select a country')
  }).optional()
});

const eventDetailsSchema = z.object({
  type: z.string().min(1, 'Please select an event type'),
  date: z.date(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  guestCount: z.number().min(1, 'Guest count must be at least 1').optional(),
  location: z.string().min(5, 'Event location must be at least 5 characters').optional(),
  specialRequests: z.string().optional()
});

export function CustomerForm({
  customerInfo,
  eventDetails,
  onCustomerInfoChange,
  onEventDetailsChange,
  onValidationChange
}: CustomerFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [includeAddress, setIncludeAddress] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const eventTypes = [
    'Wedding',
    'Birthday Party',
    'Corporate Event',
    'Anniversary',
    'Baby Shower',
    'Graduation',
    'Holiday Party',
    'Engagement Party',
    'Retirement Party',
    'Other'
  ];

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'France',
    'Germany',
    'Australia',
    'Other'
  ];

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      customerInfoSchema.parse(customerInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
    }

    try {
      eventDetailsSchema.parse(eventDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const path = `event.${err.path.join('.')}`;
          newErrors[path] = err.message;
        });
      }
    }

    setErrors(newErrors);
    const formIsValid = Object.keys(newErrors).length === 0;
    setIsValid(formIsValid);
    onValidationChange(formIsValid);
  };

  // Effect to validate form when data changes
  useEffect(() => {
    validateForm();
  }, [customerInfo, eventDetails]);

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: any) => {
    const updatedInfo = { ...customerInfo, [field]: value };
    onCustomerInfoChange(updatedInfo);
  };

  const handleAddressChange = (field: string, value: string) => {
    const updatedInfo = {
      ...customerInfo,
      address: {
        street: customerInfo.address?.street || '',
        city: customerInfo.address?.city || '',
        state: customerInfo.address?.state || '',
        zipCode: customerInfo.address?.zipCode || '',
        country: customerInfo.address?.country || '',
        ...customerInfo.address,
        [field]: value
      }
    };
    onCustomerInfoChange(updatedInfo);
  };

  const handleEventDetailsChange = (field: keyof EventDetails, value: any) => {
    const updatedDetails = { ...eventDetails, [field]: value };
    onEventDetailsChange(updatedDetails);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return digits;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
        <p className="text-gray-600">Please provide your details and event information</p>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={customerInfo.firstName}
                onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={customerInfo.lastName}
                onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => handleCustomerInfoChange('phone', formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAddress"
              checked={includeAddress}
              onCheckedChange={(checked) => setIncludeAddress(checked === true)}
            />
            <Label htmlFor="includeAddress">Include billing address</Label>
          </div>

          {includeAddress && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Billing Address
              </h4>
              
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={customerInfo.address?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder="123 Main Street"
                  className={errors['address.street'] ? 'border-red-500' : ''}
                />
                {errors['address.street'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['address.street']}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={customerInfo.address?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    placeholder="City"
                    className={errors['address.city'] ? 'border-red-500' : ''}
                  />
                  {errors['address.city'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={customerInfo.address?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State"
                    className={errors['address.state'] ? 'border-red-500' : ''}
                  />
                  {errors['address.state'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['address.state']}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={customerInfo.address?.zipCode || ''}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    placeholder="12345"
                    className={errors['address.zipCode'] ? 'border-red-500' : ''}
                  />
                  {errors['address.zipCode'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['address.zipCode']}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={customerInfo.address?.country || ''}
                  onValueChange={(value) => handleAddressChange('country', value)}
                >
                  <SelectTrigger className={errors['address.country'] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors['address.country'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['address.country']}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="eventType">Event Type *</Label>
            <Select
              value={eventDetails.type}
              onValueChange={(value) => handleEventDetailsChange('type', value)}
            >
              <SelectTrigger className={errors['event.type'] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['event.type'] && (
              <p className="text-red-500 text-sm mt-1">{errors['event.type']}</p>
            )}
          </div>

          <div>
            <Label htmlFor="guestCount">Expected Guest Count</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="guestCount"
                type="number"
                value={eventDetails.guestCount || ''}
                onChange={(e) => handleEventDetailsChange('guestCount', parseInt(e.target.value) || undefined)}
                placeholder="Number of guests"
                className="pl-10"
                min="1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eventLocation">Event Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="eventLocation"
                value={eventDetails.location || ''}
                onChange={(e) => handleEventDetailsChange('location', e.target.value)}
                placeholder="Where will the event take place?"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialRequests">Special Requests or Notes</Label>
            <Textarea
              id="specialRequests"
              value={eventDetails.specialRequests || ''}
              onChange={(e) => handleEventDetailsChange('specialRequests', e.target.value)}
              placeholder="Any special requirements, dietary restrictions, or additional information..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Please correct the following errors:
            <ul className="list-disc list-inside mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All information looks good! You can proceed to payment.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}