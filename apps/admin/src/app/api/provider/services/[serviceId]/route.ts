import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  subcategory: z.string().optional(),
  pricingType: z.enum(['FIXED', 'QUOTE']).optional(),
  basePrice: z.number().nullable().optional(),
  priceUnit: z.string().optional(),
  location: z.string().optional(),
  coverageArea: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { serviceId } = params;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            rating: true,
            reviewCount: true,
          }
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service,
    });

  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch service' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { serviceId } = params;
    const body = await request.json();
    const validatedData = updateServiceSchema.parse(body);

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true }
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Update the service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: validatedData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            rating: true,
            reviewCount: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      service: updatedService,
      message: 'Service updated successfully',
    });

  } catch (error) {
    console.error('Service update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update service',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { serviceId } = params;

    // Check if service exists and get related data
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        _count: {
          select: {
            bookings: true,
          }
        }
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if service has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: serviceId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PAID']
        }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete service with active bookings',
          message: 'Please complete or cancel all active bookings before deleting this service.'
        },
        { status: 400 }
      );
    }

    // Delete the service
    await prisma.service.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });

  } catch (error) {
    console.error('Service deletion error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete service',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}