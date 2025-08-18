// Booking utilities for the unified platform
import type { Booking, BookingStatus, SelectedService } from '@/types';
import { z } from 'zod';
import { logger } from './production-logger';

// Validation schema for booking data
const bookingDataSchema = z.object({
  services: z.array(z.object({
    serviceId: z.string(),
    providerId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
  eventDetails: z.object({
    type: z.string().min(1),
    date: z.date(),
    startTime: z.string(),
    endTime: z.string(),
    guestCount: z.number().optional(),
    location: z.string().optional(),
  }),
  customerInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
});

export async function createBooking(bookingData: any): Promise<Booking> {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create booking');
    }

    return result.booking;
  } catch (error) {
    logger.error('Error creating booking:', error);
    throw error;
  }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update booking status');
    }

    return result.booking;
  } catch (error) {
    logger.error('Error updating booking status:', error);
    throw error;
  }
}

export function calculateBookingTotal(
  services: SelectedService[], 
  taxRate: number = 0.08, 
  processingFeeRate: number = 0.029,
  processingFeeFixed: number = 0.30
): { subtotal: number; taxes: number; fees: number; total: number } {
  const subtotal = services.reduce((sum, service) => sum + service.price, 0);
  const taxes = subtotal * taxRate;
  const fees = subtotal * processingFeeRate + processingFeeFixed;
  const total = subtotal + taxes + fees;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    fees: Math.round(fees * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function validateBookingData(data: any): { isValid: boolean; errors: string[] } {
  try {
    bookingDataSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Invalid booking data'] };
  }
}

export function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `BK${timestamp}${random}`;
}

export function formatBookingDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatBookingTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'PAID':
      return 'bg-blue-100 text-blue-800';
    case 'DELIVERED':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getBookingStatusText(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending Confirmation';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PAID':
      return 'Paid';
    case 'DELIVERED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}