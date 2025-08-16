import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../bookings/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  "auth.api.getSession": jest.fn(),
  requireAuth: jest.fn(),
}));

// Mock Stripe
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
  })),
}));

// Mock email service
jest.mock('@/lib/email-service', () => ({
  sendBookingConfirmation: jest.fn(),
  sendBookingUpdate: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { auth, requireAuth } from '@/lib/auth';
import { sendBookingConfirmation, sendBookingUpdate } from '@/lib/email-service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
};

const mockService = {
  id: 'service-1',
  name: 'Wedding Photography',
  basePrice: 1500,
  providerId: 'provider-1',
  isActive: true,
};

const mockProvider = {
  id: 'provider-1',
  businessName: 'Amazing Photos',
  userId: 'provider-user-1',
  isVerified: true,
};

const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  serviceId: 'service-1',
  providerId: 'provider-1',
  status: 'pending',
  eventType: 'Wedding',
  eventDate: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '22:00',
  guestCount: 100,
  location: 'Test Venue',
  totalAmount: 1500,
  paymentIntentId: 'pi_test_123',
  createdAt: new Date(),
  updatedAt: new Date(),
  service: mockService,
  provider: mockProvider,
  user: mockUser,
};

describe('/api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (auth.api.getSession as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe('GET /api/bookings', () => {
    it('should return user bookings', async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);
      (prisma.booking.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/bookings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookings).toHaveLength(1);
      expect(data.bookings[0]).toMatchObject({
        id: 'booking-1',
        status: 'pending',
        eventType: 'Wedding',
      });
      expect(data.total).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings?status=confirmed');

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        { ...mockBooking, status: 'confirmed' }
      ]);

      const response = await GET(request);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'confirmed',
          }),
        })
      );
    });

    it('should paginate results', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings?page=2&limit=10');

      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.booking.count as jest.Mock).mockResolvedValue(0);

      const response = await GET(request);

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should handle unauthorized access', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/bookings');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/bookings', () => {
    const validBookingData = {
      serviceId: 'service-1',
      eventType: 'Wedding',
      eventDate: '2024-06-15',
      startTime: '14:00',
      endTime: '22:00',
      guestCount: 100,
      location: 'Test Venue',
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      specialRequests: 'Please arrive early',
    };

    it('should create a new booking', async () => {
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.booking).toMatchObject({
        id: 'booking-1',
        status: 'pending',
      });
      expect(sendBookingConfirmation).toHaveBeenCalledWith(mockBooking);
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validBookingData };
      delete invalidData.serviceId;

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Service ID is required');
    });

    it('should validate event date is in the future', async () => {
      const pastDateData = {
        ...validBookingData,
        eventDate: '2020-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(pastDateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Event date must be in the future');
    });

    it('should validate service exists and is active', async () => {
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Service not found or inactive');
    });

    it('should check provider availability', async () => {
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);

      // Mock existing booking at the same time
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'existing-booking',
          eventDate: new Date('2024-06-15'),
          startTime: '15:00',
          endTime: '20:00',
        }
      ]);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Provider is not available at the selected time');
    });

    it('should handle Stripe payment intent creation', async () => {
      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
      (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]); // No conflicts
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const Stripe = require('stripe');
      const mockStripe = new Stripe();
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_test',
      });

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 150000, // $1500 in cents
        currency: 'usd',
        metadata: {
          bookingId: 'booking-1',
          serviceId: 'service-1',
          providerId: 'provider-1',
        },
      });
    });

    it('should handle database errors', async () => {
      (prisma.service.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validBookingData,
        customerInfo: {
          ...validBookingData.customerInfo,
          email: 'invalid-email',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidEmailData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        ...validBookingData,
        customerInfo: {
          ...validBookingData.customerInfo,
          phone: '123',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidPhoneData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid phone number format');
    });

    it('should validate guest count is positive', async () => {
      const invalidGuestData = {
        ...validBookingData,
        guestCount: -5,
      };

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidGuestData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Guest count must be a positive number');
    });
  });

  describe('PUT /api/bookings', () => {
    it('should update booking status', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: 'confirmed',
      });

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'booking-1',
          status: 'confirmed',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.booking.status).toBe('confirmed');
      expect(sendBookingUpdate).toHaveBeenCalled();
    });

    it('should validate booking exists', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'nonexistent-booking',
          status: 'confirmed',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Booking not found');
    });

    it('should validate user owns booking or is provider', async () => {
      const otherUserBooking = {
        ...mockBooking,
        userId: 'other-user',
        providerId: 'other-provider',
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(otherUserBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'booking-1',
          status: 'confirmed',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Not authorized to update this booking');
    });

    it('should validate status transitions', async () => {
      const completedBooking = {
        ...mockBooking,
        status: 'completed',
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(completedBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'booking-1',
          status: 'pending',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status transition');
    });
  });

  describe('DELETE /api/bookings', () => {
    it('should cancel booking', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: 'cancelled',
      });

      const request = new NextRequest('http://localhost:3000/api/bookings?id=booking-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.booking.status).toBe('cancelled');
    });

    it('should validate booking can be cancelled', async () => {
      const completedBooking = {
        ...mockBooking,
        status: 'completed',
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(completedBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings?id=booking-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot cancel completed booking');
    });

    it('should validate cancellation timing', async () => {
      const nearFutureBooking = {
        ...mockBooking,
        eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(nearFutureBooking);

      const request = new NextRequest('http://localhost:3000/api/bookings?id=booking-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot cancel booking less than 48 hours before event');
    });
  });

  describe('Provider-specific endpoints', () => {
    const providerUser = {
      ...mockUser,
      id: 'provider-user-1',
      role: 'provider',
    };

    beforeEach(() => {
      (requireAuth as jest.Mock).mockResolvedValue(providerUser);
    });

    it('should return provider bookings', async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

      const request = new NextRequest('http://localhost:3000/api/bookings?provider=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider: { userId: 'provider-user-1' },
          }),
        })
      );
    });

    it('should allow provider to update booking status', async () => {
      const providerBooking = {
        ...mockBooking,
        provider: { ...mockProvider, userId: 'provider-user-1' },
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(providerBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...providerBooking,
        status: 'confirmed',
      });

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'booking-1',
          status: 'confirmed',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Admin-specific endpoints', () => {
    const adminUser = {
      ...mockUser,
      role: 'admin',
    };

    beforeEach(() => {
      (requireAuth as jest.Mock).mockResolvedValue(adminUser);
    });

    it('should return all bookings for admin', async () => {
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

      const request = new NextRequest('http://localhost:3000/api/bookings?admin=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // No user-specific filtering for admin
        })
      );
    });

    it('should allow admin to update any booking', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: 'confirmed',
      });

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'booking-1',
          status: 'confirmed',
        }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
    });
  });
});