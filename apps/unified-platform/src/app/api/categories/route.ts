import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/categories';

export async function GET(request: NextRequest) {
  try {
    const categories = await CategoryService.getAllCategories();

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}