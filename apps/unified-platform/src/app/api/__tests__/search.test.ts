import { NextRequest } from 'next/server';
import { POST } from '../search/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    service: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

// Mock search utilities
jest.mock('@/lib/search', () => ({
  buildSearchQuery: jest.fn(),
  buildSearchFilters: jest.fn(),
  calculateRelevanceScore: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { buildSearchQuery, buildSearchFilters } from '@/lib/search';

const mockServices = [
  {
    id: 'service-1',
    name: 'Wedding Photography Package',
    description: 'Professional wedding photography service',
    category: 'Photography',
    basePrice: 1500,
    priceUnit: 'per_event',
    rating: 4.8,
    reviewCount: 25,
    images: ['photo1.jpg'],
    features: ['8 hours coverage', 'Digital gallery'],
    provider: {
      id: 'provider-1',
      businessName: 'Amazing Photos',
      isVerified: true,
      rating: 4.8,
      reviewCount: 25,
      location: {
        address: '123 Photo St',
        city: 'New York',
        state: 'NY',
        coordinates: [-74.006, 40.7128],
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-2',
    name: 'Grand Ballroom Venue',
    description: 'Elegant wedding venue with capacity for 200 guests',
    category: 'Venues',
    basePrice: 2500,
    priceUnit: 'per_day',
    rating: 4.9,
    reviewCount: 15,
    images: ['venue1.jpg'],
    features: ['Capacity for 200', 'Built-in sound system'],
    provider: {
      id: 'provider-2',
      businessName: 'Grand Events',
      isVerified: true,
      rating: 4.9,
      reviewCount: 15,
      location: {
        address: '456 Event Ave',
        city: 'New York',
        state: 'NY',
        coordinates: [-74.006, 40.7128],
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCategories = [
  { id: 'photography', name: 'Photography', count: 150 },
  { id: 'venues', name: 'Venues', count: 85 },
  { id: 'catering', name: 'Catering', count: 120 },
];

describe('/api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);
    (prisma.service.count as jest.Mock).mockResolvedValue(mockServices.length);
    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);
    (buildSearchQuery as jest.Mock).mockReturnValue({
      where: {},
      orderBy: [{ rating: 'desc' }],
    });
    (buildSearchFilters as jest.Mock).mockReturnValue({});
  });

  it('should handle basic search request', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding photography',
        location: 'New York',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.results[0]).toMatchObject({
      id: 'service-1',
      name: 'Wedding Photography Package',
      category: 'Photography',
    });
  });

  it('should handle search with filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        location: 'New York',
        category: 'Photography',
        priceMin: 1000,
        priceMax: 2000,
        rating: 4.5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(buildSearchFilters).toHaveBeenCalledWith({
      category: 'Photography',
      priceMin: 1000,
      priceMax: 2000,
      rating: 4.5,
    });
  });

  it('should handle pagination', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        page: 2,
        limit: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('should handle sorting options', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        sort: 'price_asc',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(buildSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'price_asc',
      })
    );
  });

  it('should return empty results for no matches', async () => {
    (prisma.service.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.service.count as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'nonexistent service',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it('should handle invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request body');
  });

  it('should handle missing query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        location: 'New York',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Query parameter is required');
  });

  it('should handle database errors', async () => {
    (prisma.service.findMany as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding photography',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should include provider information in results', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding photography',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].provider).toMatchObject({
      id: 'provider-1',
      businessName: 'Amazing Photos',
      isVerified: true,
      rating: 4.8,
    });
  });

  it('should handle location-based search', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        location: 'New York',
        radius: 25,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(buildSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'New York',
        radius: 25,
      })
    );
  });

  it('should return categories with search results', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        includeCategories: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual(mockCategories);
  });

  it('should handle availability filter', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        availableDate: '2024-06-15',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(buildSearchFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        availableDate: '2024-06-15',
      })
    );
  });

  it('should validate price range filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        priceMin: 2000,
        priceMax: 1000, // Invalid: min > max
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid price range: minimum price cannot be greater than maximum price');
  });

  it('should limit results per page', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding',
        limit: 100, // Exceeds maximum
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50, // Should be capped at maximum
      })
    );
  });

  it('should handle search analytics tracking', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wedding photography',
        location: 'New York',
        trackAnalytics: true,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Analytics tracking would be tested separately
  });

  it('should return search suggestions for partial queries', async () => {
    const request = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'wed',
        suggestions: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toBeDefined();
  });

  it('should handle concurrent search requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: `wedding ${i}`,
        }),
      })
    );

    const responses = await Promise.all(requests.map(req => POST(req)));

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});