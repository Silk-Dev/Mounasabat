import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/../../packages/database/src/generated/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
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

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, ...preferencesData } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error creating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to create preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
        { error: 'User not found' },
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

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, ...preferencesData } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    return NextResponse.json(
      { error: 'Failed to reset preferences' },
      { status: 500 }
    );
  }
}