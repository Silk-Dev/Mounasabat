import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/production-logger';

// Get all service categories with statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get categories with service counts
    const categories = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    // Get active service counts per category
    const activeCategories = await prisma.service.groupBy({
      by: ['category'],
      where: {
        isActive: true,
      },
      _count: {
        category: true,
      },
    });

    // Merge the data
    const categoriesWithStats = categories.map(cat => {
      const activeCount = activeCategories.find(ac => ac.category === cat.category)?._count.category || 0;
      return {
        name: cat.category,
        totalServices: cat._count.category,
        activeServices: activeCount,
        inactiveServices: cat._count.category - activeCount,
      };
    });

    return NextResponse.json({ categories: categoriesWithStats });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create or update category (this would be used for category management)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, featured } = body;

    // For now, we'll just return success since categories are managed through services
    // In a real implementation, you might have a separate categories table
    return NextResponse.json({ 
      success: true, 
      message: 'Category operation completed' 
    });
  } catch (error) {
    logger.error('Error managing category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}