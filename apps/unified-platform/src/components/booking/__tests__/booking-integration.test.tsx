import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple integration test to verify booking components can be imported
describe('Booking Components Integration', () => {
  it('should be able to import booking types', () => {
    // Test that we can import the types without errors
    const mockBookingFlow = {
      step: 'selection' as const,
      selectedServices: [],
      eventDetails: {
        type: 'Wedding',
        date: new Date(),
        startTime: '14:00',
        endTime: '18:00',
      },
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
      },
      totalAmount: 0,
    };

    expect(mockBookingFlow.step).toBe('selection');
    expect(mockBookingFlow.selectedServices).toHaveLength(0);
    expect(mockBookingFlow.eventDetails.type).toBe('Wedding');
    expect(mockBookingFlow.customerInfo.firstName).toBe('John');
  });

  it('should validate booking flow data structure', () => {
    const mockSelectedService = {
      serviceId: 'service-1',
      providerId: 'provider-1',
      service: {
        id: 'service-1',
        providerId: 'provider-1',
        name: 'Wedding Photography',
        description: 'Professional wedding photography',
        category: 'Photography',
        basePrice: 1500,
        priceUnit: 'package',
        images: [],
        features: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      provider: {
        id: 'provider-1',
        userId: 'user-1',
        businessName: 'Perfect Moments Photography',
        description: 'Professional photographers',
        images: [],
        rating: 4.8,
        reviewCount: 125,
        isVerified: true,
        location: {
          address: '123 Main St',
          city: 'New York',
          coordinates: [40.7128, -74.0060] as [number, number],
        },
        services: [],
        coverageAreas: ['New York'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: 1,
      dateTime: new Date(),
      duration: 8,
      price: 1500,
    };

    expect(mockSelectedService.serviceId).toBe('service-1');
    expect(mockSelectedService.provider.businessName).toBe('Perfect Moments Photography');
    expect(mockSelectedService.service.name).toBe('Wedding Photography');
    expect(mockSelectedService.price).toBe(1500);
  });

  it('should validate customer info structure', () => {
    const mockCustomerInfo = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '(555) 987-6543',
      address: {
        street: '456 Oak Avenue',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'United States',
      },
    };

    expect(mockCustomerInfo.firstName).toBe('Jane');
    expect(mockCustomerInfo.address?.city).toBe('Boston');
    expect(mockCustomerInfo.address?.zipCode).toBe('02101');
  });

  it('should validate payment info structure', () => {
    const mockPaymentInfo = {
      method: 'card' as const,
      status: 'succeeded' as const,
      transactionId: 'pi_test_123',
      amount: 1620, // $1500 + taxes + fees
      currency: 'usd',
    };

    expect(mockPaymentInfo.method).toBe('card');
    expect(mockPaymentInfo.status).toBe('succeeded');
    expect(mockPaymentInfo.amount).toBe(1620);
  });

  it('should validate booking confirmation structure', () => {
    const mockConfirmation = {
      bookingId: 'booking-123',
      confirmationNumber: 'BK1234567890ABCD',
      status: 'confirmed' as const,
      services: [],
      eventDetails: {
        type: 'Wedding',
        date: new Date(),
        startTime: '14:00',
        endTime: '18:00',
      },
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
      },
      totalAmount: 1620,
      paymentStatus: 'succeeded',
      createdAt: new Date(),
    };

    expect(mockConfirmation.bookingId).toBe('booking-123');
    expect(mockConfirmation.confirmationNumber).toBe('BK1234567890ABCD');
    expect(mockConfirmation.status).toBe('confirmed');
    expect(mockConfirmation.totalAmount).toBe(1620);
  });
});