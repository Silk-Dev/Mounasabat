import { prisma } from '@mounasabet/database/src/prisma';

export async function createBooking(data: any) {
  try {
    // Validate required fields
    if (!data.userId || !data.serviceId || !data.providerId) {
      throw new Error('Missing required fields: userId, serviceId, or providerId');
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        serviceId: data.serviceId,
        providerId: data.providerId,
        eventId: data.eventId,
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : new Date(),
        status: data.status || 'PENDING',
        paymentStatus: data.paymentStatus || 'UNPAID',
        totalAmount: data.totalAmount || 0,
        notes: data.notes,
      },
      include: {
        service: true,
        provider: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
}

export async function getBooking(id: string) {
  try {
    if (!id) {
      throw new Error('Booking ID is required');
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        provider: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

export async function getPricingPlans() {
  try {
    // Get pricing plans from database or system settings
    const pricingPlans = await prisma.systemSettings.findMany({
      where: {
        key: {
          startsWith: 'pricing_plan_',
        },
      },
    });

    // If no pricing plans exist in database, return empty array
    if (!pricingPlans.length) {
      return [];
    }

    // Transform system settings to pricing plan format
    return pricingPlans.map(plan => {
      const planData = plan.value as any;
      return {
        id: plan.key.replace('pricing_plan_', ''),
        name: planData.name || 'Unknown Plan',
        price: planData.price || 0,
        currency: planData.currency || 'USD',
        features: planData.features || [],
        description: planData.description || '',
        isActive: planData.isActive !== false,
      };
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    // Return empty array instead of mock data
    return [];
  }
}

export interface Pricing {
  id: string;
  name: string;
  price: number;
  currency?: string;
  quantity?: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  description: string;
  isActive: boolean;
}

export interface BookingData {
  userId: string;
  serviceId: string;
  providerId: string;
  eventId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  notes?: string;
}

export function calculateTotalPrice(items: Pricing[]): number {
  return items.reduce((total, item) => {
    const quantity = item.quantity || 1;
    return total + (item.price * quantity);
  }, 0);
}
