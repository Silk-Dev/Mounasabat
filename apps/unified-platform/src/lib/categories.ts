import { prisma } from './prisma';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export class CategoryService {
  /**
   * Get all active categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return categories;
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Get categories from existing services and products (fallback)
   */
  static async getCategoriesFromServices(): Promise<Category[]> {
    try {
      // Get unique categories from services
      const serviceCategories = await prisma.service.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      });

      // Get unique categories from products
      const productCategories = await prisma.product.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      });

      // Combine and deduplicate categories
      const allCategories = [
        ...serviceCategories.map(s => s.category),
        ...productCategories.map(p => p.category),
      ];

      const uniqueCategories = [...new Set(allCategories)].sort();

      // Transform to category objects with additional metadata
      return uniqueCategories.map((name, index) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        icon: this.getCategoryIcon(name),
        description: this.getCategoryDescription(name),
        isActive: true,
        sortOrder: index,
      }));
    } catch (error) {
      console.error('Failed to get categories from services:', error);
      return [];
    }
  }

  /**
   * Get all categories (from Category table first, fallback to services)
   */
  static async getAllCategories(): Promise<Category[]> {
    try {
      // First try to get from Category table
      const categories = await this.getCategories();
      
      if (categories.length > 0) {
        return categories;
      }

      // Fallback to getting from services/products
      return await this.getCategoriesFromServices();
    } catch (error) {
      console.error('Failed to get all categories:', error);
      return [];
    }
  }

  /**
   * Get trending categories (first 6 categories)
   */
  static async getTrendingCategories(): Promise<Category[]> {
    const categories = await this.getAllCategories();
    return categories.slice(0, 6);
  }

  /**
   * Create default categories if none exist
   */
  static async seedDefaultCategories(): Promise<void> {
    try {
      const existingCount = await prisma.category.count();
      
      if (existingCount > 0) {
        return; // Categories already exist
      }

      const defaultCategories = [
        { name: 'Venues', icon: '🏛️', description: 'Event venues and location rentals' },
        { name: 'Catering', icon: '🍽️', description: 'Food and beverage services for events' },
        { name: 'Photography', icon: '📸', description: 'Professional photography and videography' },
        { name: 'Entertainment', icon: '🎵', description: 'Live entertainment and performance services' },
        { name: 'Decoration', icon: '🌸', description: 'Event decoration and styling services' },
        { name: 'Event Planning', icon: '📋', description: 'Complete event planning and coordination services' },
        { name: 'Transportation', icon: '🚗', description: 'Transportation and logistics services' },
        { name: 'Beauty & Wellness', icon: '💄', description: 'Beauty, wellness, and spa services' },
      ];

      await prisma.category.createMany({
        data: defaultCategories.map((category, index) => ({
          id: crypto.randomUUID(),
          name: category.name,
          slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          icon: category.icon,
          description: category.description,
          isActive: true,
          sortOrder: index,
        })),
      });

      console.log('Default categories seeded successfully');
    } catch (error) {
      console.error('Failed to seed default categories:', error);
    }
  }

  private static getCategoryIcon(categoryName: string): string {
    const iconMap: Record<string, string> = {
      'Wedding Planning': '💒',
      'Event Planning': '📋',
      'Catering': '🍽️',
      'Photography': '📸',
      'Venues': '🏛️',
      'Entertainment': '🎭',
      'Decoration': '🎨',
      'Transportation': '🚗',
      'Beauty & Wellness': '💄',
      'Flowers': '🌸',
      'Music': '🎵',
      'Lighting': '💡',
      'Security': '🛡️',
    };

    return iconMap[categoryName] || '📋';
  }

  private static getCategoryDescription(categoryName: string): string {
    const descriptionMap: Record<string, string> = {
      'Wedding Planning': 'Complete wedding planning and coordination services',
      'Event Planning': 'Professional event planning and coordination services',
      'Catering': 'Food and beverage services for events',
      'Photography': 'Professional photography and videography',
      'Venues': 'Event venues and location rentals',
      'Entertainment': 'Live entertainment and performance services',
      'Decoration': 'Event decoration and styling services',
      'Transportation': 'Transportation and logistics services',
      'Beauty & Wellness': 'Beauty, wellness, and spa services',
      'Flowers': 'Floral arrangements and decorations',
      'Music': 'Musical entertainment and sound services',
      'Lighting': 'Professional lighting and audio-visual',
      'Security': 'Event security and safety services',
    };

    return descriptionMap[categoryName] || `${categoryName} services`;
  }
}