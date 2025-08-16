import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CategoryService } from '@/lib/categories';
import { logger } from '../../../lib/production-logger';
import { withApiMiddleware } from '@/lib/api-middleware';
import { ApiResponseBuilder } from '@/lib/api-response';

// Validation schema for query parameters
const categoriesQuerySchema = z.object({
  includeStats: z.enum(['true', 'false']).default('false'),
  includeSubcategories: z.enum(['true', 'false']).default('true'),
  activeOnly: z.enum(['true', 'false']).default('true'),
});

async function handleGET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Validate and sanitize query parameters
  const validatedQuery = categoriesQuerySchema.parse(queryParams);
  const { includeStats, includeSubcategories, activeOnly } = validatedQuery;

  // Get categories with options
  const options = {
    includeStats: includeStats === 'true',
    includeSubcategories: includeSubcategories === 'true',
    activeOnly: activeOnly === 'true',
  };

  const categories = await CategoryService.getAllCategories(options);

  // Validate categories data
  if (!Array.isArray(categories)) {
    logger.error('CategoryService returned invalid data:', { categories });
    throw new Error('Invalid categories data received');
  }

  // Sanitize categories data
  const sanitizedCategories = categories.map(category => {
    try {
      return {
        id: category.id || 'unknown',
        name: category.name || 'Unknown Category',
        slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        description: category.description || '',
        icon: category.icon || null,
        color: category.color || '#000000',
        isActive: category.isActive !== false, // Default to true if not specified
        sortOrder: typeof category.sortOrder === 'number' ? category.sortOrder : 0,
        subcategories: includeSubcategories === 'true' && Array.isArray(category.subcategories) 
          ? category.subcategories.map(sub => ({
              id: sub.id || 'unknown',
              name: sub.name || 'Unknown Subcategory',
              slug: sub.slug || sub.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
              description: sub.description || '',
              isActive: sub.isActive !== false,
              sortOrder: typeof sub.sortOrder === 'number' ? sub.sortOrder : 0,
              serviceCount: includeStats === 'true' ? (sub.serviceCount || 0) : undefined,
            }))
          : undefined,
        serviceCount: includeStats === 'true' ? (category.serviceCount || 0) : undefined,
        providerCount: includeStats === 'true' ? (category.providerCount || 0) : undefined,
        createdAt: category.createdAt || new Date().toISOString(),
        updatedAt: category.updatedAt || new Date().toISOString(),
      };
    } catch (categoryError) {
      logger.error('Error sanitizing category:', categoryError, { categoryId: category.id });
      // Return a minimal safe version
      return {
        id: category.id || 'unknown',
        name: 'Unknown Category',
        slug: 'unknown',
        description: '',
        icon: null,
        color: '#000000',
        isActive: false,
        sortOrder: 0,
        subcategories: undefined,
        serviceCount: undefined,
        providerCount: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  });

  // Calculate additional metadata
  const metadata = {
    totalCategories: sanitizedCategories.length,
    activeCategories: sanitizedCategories.filter(cat => cat.isActive).length,
    totalSubcategories: includeSubcategories === 'true' 
      ? sanitizedCategories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)
      : undefined,
    lastUpdated: sanitizedCategories.length > 0 
      ? sanitizedCategories.reduce((latest, cat) => 
          new Date(cat.updatedAt) > new Date(latest) ? cat.updatedAt : latest, 
          sanitizedCategories[0].updatedAt
        )
      : new Date().toISOString(),
  };

  return ApiResponseBuilder.success({
    categories: sanitizedCategories,
    metadata,
  }, 'Categories retrieved successfully');
}

// Export wrapped handler with proper error handling
export const GET = withApiMiddleware(handleGET, {
  component: 'categories_api',
  logRequests: true,
});