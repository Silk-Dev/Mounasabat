import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';
import { z } from 'zod';
import { detectLanguage, getUserProfileMessages, type Language } from '@mounasabet/utils';

const prisma = new PrismaClient();

// Schema for profile update validation
const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  language: z.enum(['fr', 'ar']).optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    }).optional(),
    darkMode: z.boolean().optional(),
    currency: z.enum(['TND', 'EUR', 'USD']).optional(),
    displayName: z.string().min(2).optional(),
    timezone: z.string().optional(),
  }).optional().nullable(),
});

// Get user profile
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user language preference or detect from request
    const userLanguage = (session.user.language as Language) || 
      detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(userLanguage);
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        language: true,
        phoneNumber: true,
        address: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: messages.profile.notFound 
      }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user profile' 
    }, { status: 500 });
  }
}

// Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user language preference or detect from request
    const userLanguage = (session.user.language as Language) || 
      detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(userLanguage);
    
    const data = await req.json();
    
    // Validate input data
    const validationResult = profileUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    // Check if language is being updated
    const isLanguageChanged = data.language && data.language !== session.user.language;
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validationResult.data,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        language: true,
        phoneNumber: true,
        address: true,
        preferences: true,
        updatedAt: true,
      }
    });
    
    // Return appropriate success message based on what was updated
    const message = isLanguageChanged 
      ? messages.preferences.languageChanged 
      : messages.profile.updateSuccess;
    
    return NextResponse.json({
      user: updatedUser,
      message
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Get language from request headers as fallback
    const language = detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(language);
    
    return NextResponse.json({ 
      error: messages.profile.updateError 
    }, { status: 500 });
  }
}