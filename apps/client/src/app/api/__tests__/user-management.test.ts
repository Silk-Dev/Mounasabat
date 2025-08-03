import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@mounasabet/database/src/auth';
import { GET as getProfile, PUT as updateProfile } from '../user/profile/route';
import { GET as getOrders } from '../user/orders/route';
import { GET as getBookings } from '../user/bookings/route';
import { GET as getFavorites, POST as addFavorite } from '../user/favorites/route';
import { DELETE as removeFavorite } from '../user/favorites/[id]/route';
import { GET as getDashboard } from '../user/dashboard/route';

// Mock i18n functions
// jest.mock('@mounasabet/utils/i18n', () => ({
//   detectLanguage: jest.fn(() => 'fr'),
//   getUserProfileMessages: jest.fn(() => ({
//     profile: {
//       updateSuccess: 'Profil mis à jour avec succès.',
//       updateError: 'Erreur lors de la mise à jour du profil.',
//       notFound: 'Profil utilisateur non trouvé.',
//       dashboard: {
//         welcome: 'Bienvenue, {name}!',
//         recentOrders: 'Commandes récentes',
//         upcomingBookings: 'Réservations à venir',
//         viewAll: 'Voir tout',
//         noOrders: 'Vous n\'avez pas encore de commandes.',
//         noBookings: 'Vous n\'avez pas encore de réservations.',
//         noFavorites: 'Vous n\'avez pas encore de favoris.',
//       },
//     },
//     preferences: {
//       updateSuccess: 'Préférences mises à jour avec succès.',
//       languageChanged: 'Langue changée avec succès.',
//       title: 'Préférences',
//       language: 'Langue',
//       notifications: 'Notifications',
//       emailNotifications: 'Notifications par email',
//       smsNotifications: 'Notifications par SMS',
//       pushNotifications: 'Notifications push',
//       darkMode: 'Mode sombre',
//       currency: 'Devise',
//     },
//     favorites: {
//       added: 'Ajouté aux favoris avec succès.',
//       removed: 'Retiré des favoris avec succès.',
//       alreadyExists: 'Cet élément est déjà dans vos favoris.',
//       notFound: 'Favori non trouvé.',
//       providers: 'Prestataires',
//       products: 'Produits',
//       empty: 'Vous n\'avez pas encore de favoris.',
//       filter: 'Filtrer par type',
//     },
//     validation: {
//       invalidLanguage: 'Langue non prise en charge.',
//       invalidPhoneNumber: 'Numéro de téléphone invalide.',
//       invalidPreference: 'Préférence invalide.',
//     },
//     dashboard: {
//       orders: 'Commandes',
//       bookings: 'Réservations',
//       favorites: 'Favoris',
//       profile: 'Profil',
//       settings: 'Paramètres',
//     },
//   })),
//   Language: { fr: 'fr', ar: 'ar' },
// }));

// Mock auth
jest.mock('@mounasabet/database/src/auth', () => ({
  auth: {
    getSession: jest.fn(),
  },
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('User Management API', () => {
  let mockPrisma: any;
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
  };
  
  beforeAll(() => {
    mockPrisma = new PrismaClient();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue(mockSession);
  });
  
  describe('User Profile API', () => {
    it('should get user profile', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        language: 'fr',
        phoneNumber: '+21612345678',
        address: 'Tunis, Tunisia',
        preferences: { notifications: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const req = new NextRequest('http://localhost:3000/api/user/profile');
      const response = await getProfile(req);
      const data = await response.json();
      
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });
      
      expect(data).toEqual(mockUser);
    });
    
    it('should update user profile', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        name: 'Updated Name',
        email: 'test@example.com',
        language: 'ar',
        phoneNumber: '+21612345678',
        address: 'Updated Address',
        preferences: { notifications: false },
        updatedAt: new Date(),
      };
      
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);
      
      const updateData = {
        name: 'Updated Name',
        language: 'ar',
        address: 'Updated Address',
        preferences: { notifications: false },
      };
      
      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      
      const response = await updateProfile(req);
      const data = await response.json();
      
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
        }),
      });
      
      expect(data.user).toEqual(mockUpdatedUser);
      expect(data.message).toBe('Langue changée avec succès.');
    });
    
    it('should reject invalid profile updates', async () => {
      const invalidData = {
        language: 'invalid-language',
      };
      
      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });
      
      const response = await updateProfile(req);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
  
  describe('User Orders API', () => {
    it('should get user orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-123',
          orderType: 'PRODUCT',
          status: 'COMPLETED',
          totalAmount: 100,
          items: [],
          tracking: [],
        },
      ];
      
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(1);
      
      const req = new NextRequest('http://localhost:3000/api/user/orders?page=1&limit=10');
      const response = await getOrders(req);
      const data = await response.json();
      
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123' },
        skip: 0,
        take: 10,
      }));
      
      expect(data.orders).toEqual(mockOrders);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });
  
  describe('User Bookings API', () => {
    it('should get user bookings with pagination', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          eventId: 'event-1',
          providerId: 'provider-1',
          startTime: new Date(),
          endTime: new Date(),
          status: 'CONFIRMED',
        },
      ];
      
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(1);
      
      const req = new NextRequest('http://localhost:3000/api/user/bookings?page=1&limit=10');
      const response = await getBookings(req);
      const data = await response.json();
      
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123' },
        skip: 0,
        take: 10,
      }));
      
      expect(data.bookings).toEqual(mockBookings);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });
  
  describe('User Favorites API', () => {
    it('should get user favorites with pagination', async () => {
      const mockFavorites = [
        {
          id: 'favorite-1',
          userId: 'user-123',
          providerId: 'provider-1',
          provider: {
            id: 'provider-1',
            name: 'Test Provider',
            description: 'Test Description',
            rating: 4.5,
            reviewCount: 10,
          },
        },
      ];
      
      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);
      mockPrisma.favorite.count.mockResolvedValue(1);
      
      const req = new NextRequest('http://localhost:3000/api/user/favorites?page=1&limit=10');
      const response = await getFavorites(req);
      const data = await response.json();
      
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-123' },
        skip: 0,
        take: 10,
      }));
      
      expect(data.favorites).toEqual(mockFavorites);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      expect(data.messages).toBeDefined();
    });
    
    it('should filter favorites by type', async () => {
      const mockFavorites = [
        {
          id: 'favorite-1',
          userId: 'user-123',
          providerId: 'provider-1',
          provider: {
            id: 'provider-1',
            name: 'Test Provider',
          },
        },
      ];
      
      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);
      mockPrisma.favorite.count.mockResolvedValue(1);
      
      const req = new NextRequest('http://localhost:3000/api/user/favorites?type=provider');
      const response = await getFavorites(req);
      
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { 
          userId: 'user-123',
          providerId: { not: null }
        },
      }));
    });
    
    it('should add a provider to favorites', async () => {
      const mockProvider = {
        id: 'provider-1',
        name: 'Test Provider',
      };
      
      const mockFavorite = {
        id: 'favorite-1',
        userId: 'user-123',
        providerId: 'provider-1',
        provider: mockProvider,
      };
      
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockPrisma.favorite.findFirst.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue(mockFavorite);
      
      const req = new NextRequest('http://localhost:3000/api/user/favorites', {
        method: 'POST',
        body: JSON.stringify({ providerId: 'provider-1' }),
      });
      
      const response = await addFavorite(req);
      const data = await response.json();
      
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
      });
      
      expect(mockPrisma.favorite.create).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          userId: 'user-123',
          providerId: 'provider-1',
        },
      }));
      
      expect(response.status).toBe(201);
      expect(data.favorite).toEqual(mockFavorite);
      expect(data.message).toBe('Ajouté aux favoris avec succès.');
    });
    
    it('should remove a favorite', async () => {
      const mockFavorite = {
        id: 'favorite-1',
        userId: 'user-123',
        providerId: 'provider-1',
      };
      
      mockPrisma.favorite.findFirst.mockResolvedValue(mockFavorite);
      
      const req = new NextRequest('http://localhost:3000/api/user/favorites/favorite-1', {
        method: 'DELETE',
      });
      
      const response = await removeFavorite(req, { params: { id: 'favorite-1' } });
      const data = await response.json();
      
      expect(mockPrisma.favorite.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'favorite-1',
          userId: 'user-123',
        },
      });
      
      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
        where: { id: 'favorite-1' },
      });
      
      expect(data.success).toBe(true);
      expect(data.message).toBe('Retiré des favoris avec succès.');
    });
  });
  
  describe('User Dashboard API', () => {
    it('should get user dashboard data', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        language: 'fr',
        preferences: { notifications: true },
      };
      
      const mockRecentOrders = [
        {
          id: 'order-1',
          userId: 'user-123',
          orderType: 'PRODUCT',
          status: 'COMPLETED',
          totalAmount: 100,
          items: [{ id: 'item-1', name: 'Test Item' }],
          tracking: [{ id: 'track-1', status: 'DELIVERED' }],
        },
      ];
      
      const mockUpcomingBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          eventId: 'event-1',
          startTime: new Date(Date.now() + 86400000), // Tomorrow
          endTime: new Date(Date.now() + 90000000),
          status: 'CONFIRMED',
          event: {
            id: 'event-1',
            name: 'Test Event',
            type: 'WEDDING',
          },
          service: {
            id: 'service-1',
            name: 'Test Service',
            category: 'CATERING',
            provider: {
              id: 'provider-1',
              name: 'Test Provider',
            },
          },
        },
      ];
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.order.findMany.mockResolvedValue(mockRecentOrders);
      mockPrisma.booking.findMany.mockResolvedValue(mockUpcomingBookings);
      mockPrisma.favorite.count
        .mockResolvedValueOnce(2) // Provider favorites count
        .mockResolvedValueOnce(3); // Product favorites count
      mockPrisma.order.count.mockResolvedValue(5);
      mockPrisma.booking.count.mockResolvedValue(3);
      
      const req = new NextRequest('http://localhost:3000/api/user/dashboard');
      const response = await getDashboard(req);
      const data = await response.json();
      
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          image: true,
          language: true,
          preferences: true,
        }),
      });
      
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: expect.objectContaining({
          items: { take: 1 },
          tracking: expect.objectContaining({
            orderBy: { timestamp: 'desc' },
            take: 1,
          }),
        }),
      });
      
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          startTime: { gte: expect.any(Date) }
        },
        orderBy: { startTime: 'asc' },
        take: 5,
        include: expect.objectContaining({
          event: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              type: true,
            }),
          }),
          service: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              category: true,
              provider: expect.objectContaining({
                select: expect.objectContaining({
                  id: true,
                  name: true,
                }),
              }),
            }),
          }),
        }),
      });
      
      expect(data.user).toEqual(mockUser);
      expect(data.welcomeMessage).toBe('Bienvenue, Test User!');
      expect(data.recentOrders).toEqual(mockRecentOrders);
      expect(data.upcomingBookings).toEqual(mockUpcomingBookings);
      expect(data.favorites).toEqual({
        providers: 2,
        products: 3,
        total: 5,
      });
      expect(data.counts).toEqual({
        orders: 5,
        bookings: 3,
      });
      expect(data.messages).toBeDefined();
    });
    
    it('should handle user not found in dashboard', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost:3000/api/user/dashboard');
      const response = await getDashboard(req);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Profil utilisateur non trouvé.');
    });
    
    it('should handle unauthorized access to dashboard', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);
      
      const req = new NextRequest('http://localhost:3000/api/user/dashboard');
      const response = await getDashboard(req);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});