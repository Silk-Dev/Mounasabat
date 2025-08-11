import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@mounasabet/database';

const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  pricingType: z.enum(['FIXED', 'QUOTE']),
  basePrice: z.number().nullable(),
  priceUnit: z.string().optional(),
  location: z.string().optional(),
  coverageArea: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createServiceSchema.parse(body);

    // Get provider ID from session (simplified - in real app, get from auth)
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        providerId,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        images: validatedData.images,
        pricingType: validatedData.pricingType,
        basePrice: validatedData.basePrice,
        priceUnit: validatedData.priceUnit,
        location: validatedData.location,
        coverageArea: validatedData.coverageArea,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      service,
      message: 'Service created successfully',
    });

  } catch (error) {
    console.error('Service creation error:', error);

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
        error: 'Failed to create service',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const services = await prisma.service.findMany({
      where: { providerId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.service.count({
      where: { providerId }
    });

    return NextResponse.json({
      success: true,
      services,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch services' 
      },
      { status: 500 }
    );
  }
}