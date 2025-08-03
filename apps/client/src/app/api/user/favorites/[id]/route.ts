import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';
import { detectLanguage, getUserProfileMessages, type Language } from '@mounasabet/utils';

const prisma = new PrismaClient();

// Delete a favorite
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user language preference or detect from request
    const userLanguage = (session.user.language as Language) || 
      detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(userLanguage);
    
    const favoriteId = params.id;
    
    // Check if favorite exists and belongs to the user
    const favorite = await prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId: session.user.id,
      },
    });
    
    if (!favorite) {
      return NextResponse.json({ 
        error: messages.favorites.notFound 
      }, { status: 404 });
    }
    
    // Delete favorite
    await prisma.favorite.delete({
      where: { id: favoriteId },
    });
    
    return NextResponse.json({ 
      success: true,
      message: messages.favorites.removed
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    
    // Get language from request headers as fallback
    const language = detectLanguage(req.headers.get('accept-language') || undefined);
    const messages = getUserProfileMessages(language);
    
    return NextResponse.json({ 
      error: 'Failed to remove favorite' 
    }, { status: 500 });
  }
}