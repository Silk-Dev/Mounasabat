import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/client';
import { logger } from '@/lib/production-logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, guestPreferences } = await request.json();

    if (!userId || !guestPreferences) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get current user preferences
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

    // Merge guest preferences with existing user preferences
    // Guest preferences take precedence for non-critical settings
    const currentPreferences = user.preferences as any || {};
    const mergedPreferences = {
      ...currentPreferences,
      ...guestPreferences,
      // Keep existing notification preferences if they exist
      notifications: {
        ...guestPreferences.notifications,
        ...currentPreferences.notifications,
      },
      // Merge search preferences
      searchPreferences: {
        ...guestPreferences.searchPreferences,
        ...currentPreferences.searchPreferences,
        // Combine preferred categories
        preferredCategories: [
          ...(currentPreferences.searchPreferences?.preferredCategories || []),
          ...(guestPreferences.searchPreferences?.preferredCategories || []),
        ].filter((category, index, array) => array.indexOf(category) === index), // Remove duplicates
      },
    };

    // Update user with merged preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: mergedPreferences,
        language: guestPreferences.language || user.language,
      },
    });

    const preferences = {
      id: userId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...mergedPreferences,
    };

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Guest preferences synced successfully',
    });
  } catch (error) {
    logger.error('Error syncing guest preferences:', error);
    return NextResponse.json(
      { error: 'Failed to sync guest preferences' },
      { status: 500 }
    );
  }
}