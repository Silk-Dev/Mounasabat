import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/production-logger';
import { withProviderSecurity, withPublicSecurity, createAPIResponse, sanitizeRequestBody } from '@/lib/api-security-middleware';
import { InputSanitizer } from '@/lib/security';

const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200).transform(InputSanitizer.sanitizeGeneral),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000).transform(InputSanitizer.sanitizeGeneral),
  category: z.string().min(1, 'Category is required').max(100).transform(InputSanitizer.sanitizeGeneral),
  subcategory: z.string().max(100).transform(InputSanitizer.sanitizeGeneral).optional(),
  pricingType: z.enum(['FIXED', 'QUOTE']),
  basePrice: z.number().min(0).max(1000000).nullable(),
  priceUnit: z.string().max(50).transform(InputSanitizer.sanitizeGeneral).optional(),
  location: z.string().max(200).transform(InputSanitizer.sanitizeGeneral).optional(),
  coverageArea: z.array(z.string().max(100).transform(InputSanitizer.sanitizeGeneral)).max(50).default([]),
  features: z.array(z.string().max(200).transform(InputSanitizer.sanitizeGeneral)).max(100).default([]),
  images: z.array(z.string().url('Invalid image URL').max(500)).max(20).default([]),
  isActive: z.boolean().default(true),
});

async function handlePOST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const sanitizedBody = sanitizeRequestBody(rawBody);
    const validatedData = createServiceSchema.parse(sanitizedBody);

    // Get provider ID from session (simplified - in real app, get from auth)
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Provider ID is required'),
        { status: 400 }
      );
    }

    // Validate provider ID format
    if (!z.string().uuid().safeParse(providerId).success) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid provider ID format'),
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Provider not found'),
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

    return NextResponse.json(createAPIResponse(true, service, undefined, 'Service created successfully'));

  } catch (error) {
    logger.error('Service creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid request data', 'Please check your input and try again'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to create service', 'An unexpected error occurred. Please try again.'),
      { status: 500 }
    );
  }
}

export const POST = withProviderSecurity(handlePOST);

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    if (!providerId) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Provider ID is required'),
        { status: 400 }
      );
    }

    // Validate provider ID format
    if (!z.string().uuid().safeParse(providerId).success) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid provider ID format'),
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

    const responseData = {
      services,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return NextResponse.json(createAPIResponse(true, responseData));

  } catch (error) {
    logger.error('Error fetching services:', error);
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch services'),
      { status: 500 }
    );
  }
}

export const GET = withPublicSecurity(handleGET);