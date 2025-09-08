import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/database/prisma";
import { logger } from '@/lib/production-logger';
import { withPublicSecurity, withAuthSecurity, createAPIResponse, sanitizeRequestBody } from '@/lib/api-security-middleware';
import { z } from 'zod';
import { InputSanitizer } from '@/lib/security';


// Validation schema for user preferences
const preferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  language: z.string().min(2).max(5).regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Invalid language format').optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  searchPreferences: z.object({
    defaultLocation: z.string().max(200).transform(InputSanitizer.sanitizeGeneral).optional(),
    preferredCategories: z.array(z.string().max(100).transform(InputSanitizer.sanitizeGeneral)).max(20).optional(),
    priceRange: z.object({
      min: z.number().min(0).max(1000000).optional(),
      max: z.number().min(0).max(1000000).optional(),
    }).optional(),
    sortBy: z.enum(['price', 'rating', 'distance', 'popularity']).optional(),
  }).optional(),
  privacy: z.object({
    profileVisible: z.boolean().optional(),
    showReviews: z.boolean().optional(),
    allowMessages: z.boolean().optional(),
  }).optional(),
});

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        createAPIResponse(false, null, 'User ID is required'),
        { status: 400 }
      );
    }

    // Validate userId format
    if (!z.string().uuid().safeParse(userId).success) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid user ID format'),
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
        language: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        createAPIResponse(false, null, 'User not found'),
        { status: 404 }
      );
    }

    // Parse and validate preferences from JSON
    const storedPreferences = user.preferences as any || {};
    
    const preferences = {
      id: userId,
      userId,
      language: user.language || 'en',
      currency: storedPreferences.currency || 'USD',
      notifications: {
        email: storedPreferences.notifications?.email ?? true,
        sms: storedPreferences.notifications?.sms ?? false,
        push: storedPreferences.notifications?.push ?? true,
        marketing: storedPreferences.notifications?.marketing ?? false,
      },
      searchPreferences: {
        defaultLocation: storedPreferences.searchPreferences?.defaultLocation,
        preferredCategories: storedPreferences.searchPreferences?.preferredCategories || [],
        priceRange: storedPreferences.searchPreferences?.priceRange,
        sortBy: (storedPreferences.searchPreferences?.sortBy as 'price' | 'rating' | 'distance' | 'popularity') || 'popularity',
      },
      privacy: {
        profileVisible: storedPreferences.privacy?.profileVisible ?? true,
        showReviews: storedPreferences.privacy?.showReviews ?? true,
        allowMessages: storedPreferences.privacy?.allowMessages ?? true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(createAPIResponse(true, preferences));
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch preferences'),
      { status: 500 }
    );
  }
}

export const GET = withPublicSecurity(handleGET);

async function handlePOST(request: NextRequest) {
  try {
    const rawData = await request.json();
    const sanitizedData = sanitizeRequestBody(rawData);
    
    // Validate the request data
    const validatedData = preferencesSchema.parse(sanitizedData);
    const { userId, ...preferencesData } = validatedData;

    // Update user with preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: preferencesData,
        language: preferencesData.language,
      },
    });

    const preferences = {
      id: userId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...preferencesData,
    };

    return NextResponse.json(createAPIResponse(true, preferences, undefined, 'Preferences created successfully'));
  } catch (error) {
    logger.error('Error creating preferences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid request data', 'Please check your input and try again'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to create preferences'),
      { status: 500 }
    );
  }
}

export const POST = withAuthSecurity(handlePOST);

async function handlePATCH(request: NextRequest) {
  try {
    const rawData = await request.json();
    const sanitizedData = sanitizeRequestBody(rawData);
    const { userId, updates } = sanitizedData;

    if (!userId) {
      return NextResponse.json(
        createAPIResponse(false, null, 'User ID is required'),
        { status: 400 }
      );
    }

    // Validate userId format
    if (!z.string().uuid().safeParse(userId).success) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid user ID format'),
        { status: 400 }
      );
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true, language: true },
    });

    if (!user) {
      return NextResponse.json(
        createAPIResponse(false, null, 'User not found'),
        { status: 404 }
      );
    }

    // Merge updates with existing preferences
    const currentPreferences = user.preferences as any || {};
    const updatedPreferences = { ...currentPreferences, ...updates };

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPreferences,
        language: updates.language || user.language,
      },
    });

    const preferences = {
      id: userId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updatedPreferences,
    };

    return NextResponse.json(createAPIResponse(true, preferences, undefined, 'Preferences updated successfully'));
  } catch (error) {
    logger.error('Error updating preferences:', error);
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to update preferences'),
      { status: 500 }
    );
  }
}

export const PATCH = withAuthSecurity(handlePATCH);

async function handlePUT(request: NextRequest) {
  try {
    const rawData = await request.json();
    const sanitizedData = sanitizeRequestBody(rawData);
    
    // Validate the request data
    const validatedData = preferencesSchema.parse(sanitizedData);
    const { userId, ...preferencesData } = validatedData;

    // Replace all preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: preferencesData,
        language: preferencesData.language,
      },
    });

    const preferences = {
      id: userId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...preferencesData,
    };

    return NextResponse.json(createAPIResponse(true, preferences, undefined, 'Preferences reset successfully'));
  } catch (error) {
    logger.error('Error resetting preferences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Invalid request data', 'Please check your input and try again'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to reset preferences'),
      { status: 500 }
    );
  }
}

export const PUT = withAuthSecurity(handlePUT);