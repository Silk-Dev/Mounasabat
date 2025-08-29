import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { HealthCheckService, healthCheckService } from '../health-check-service';
import { logger } from '../production-logger';

// Mock dependencies
jest.mock('../production-logger');
jest.mock('../prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    user: {
      count: jest.fn(),
    },
    systemAlert: {
      create: jest.fn(),
      count: jest.fn(),
    },
    errorLog: {
      count: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    ping: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    info: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  const mockPrisma = require('../prisma').prisma;
  const mockRedis = require('ioredis').Redis;

  beforeEach(() => {
    service = HealthCheckService.getInstance();
    service.clearCache();
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPrisma.$queryRaw.mockResolvedValue([{ count: 5, total_connections: 10, active_connections: 3, idle_connections: 7 }]);
    mockPrisma.user.count.mockResolvedValue(100);
    mockPrisma.systemAlert.create.mockResolvedValue({});
    mockPrisma.errorLog.count.mockResolvedValue(2);
    
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'acct_test',
        charges_enabled: true,
        payouts_enabled: true,
        country: 'US',
      }),
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemHealth', () => {
    it('should return healthy status when all services are working', async () => {
      // Mock Redis
      const mockRedisInstance = {
        ping: jest.fn().mockResolvedValue('PONG'),
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue('test'),
        del: jest.fn().mockResolvedValue(1),
        info: jest.fn().mockResolvedValue('used_memory_human:1.5M\nconnected_clients:5'),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      const health = await service.getSystemHealth();

      expect(health.status).toBe('healthy');
      expect(health.services.database.status).toBe('healthy');
      expect(health.services.redis.status).toBe('healthy');
      expect(health.services.stripe.status).toBe('healthy');
      expect(health.services.external_apis.status).toBe('healthy');
      expect(health.metrics).toHaveProperty('memory_usage');
      expect(health.metrics).toHaveProperty('response_time');
    });

    it('should return degraded status when non-critical services fail', async () => {
      // Mock Redis failure
      const mockRedisInstance = {
        ping: jest.fn().mockRejectedValue(new Error('Connection failed')),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      const health = await service.getSystemHealth();

      expect(health.status).toBe('degraded');
      expect(health.services.database.status).toBe('healthy');
      expect(health.services.redis.status).toBe('unhealthy');
      expect(health.degradation_info).toBeDefined();
      expect(health.degradation_info?.affected_services).toContain('redis');
    });

    it('should return unhealthy status when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const health = await service.getSystemHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.services.database.status).toBe('unhealthy');
    });

    it('should handle Stripe API failures gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const health = await service.getSystemHealth();

      expect(health.services.stripe.status).toBe('unhealthy');
      expect(health.services.stripe.error).toContain('401');
    });

    it('should handle missing environment variables', async () => {
      const originalRedisUrl = process.env.REDIS_URL;
      const originalStripeKey = process.env.STRIPE_SECRET_KEY;
      
      delete process.env.REDIS_URL;
      delete process.env.STRIPE_SECRET_KEY;

      const health = await service.getSystemHealth();

      expect(health.services.redis.status).toBe('healthy');
      expect(health.services.stripe.status).toBe('healthy');
      expect(health.services.redis.details?.note).toContain('not configured');
      expect(health.services.stripe.details?.note).toContain('not configured');

      // Restore environment variables
      if (originalRedisUrl) process.env.REDIS_URL = originalRedisUrl;
      if (originalStripeKey) process.env.STRIPE_SECRET_KEY = originalStripeKey;
    });
  });

  describe('getQuickHealth', () => {
    it('should return healthy status for quick check', async () => {
      const quickHealth = await service.getQuickHealth();

      expect(quickHealth.status).toBe('healthy');
      expect(quickHealth.responseTime).toBeGreaterThan(0);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining(['SELECT 1']));
    });

    it('should return unhealthy status when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      const quickHealth = await service.getQuickHealth();

      expect(quickHealth.status).toBe('unhealthy');
      expect(quickHealth.responseTime).toBeGreaterThan(0);
    });

    it('should return degraded status for slow responses', async () => {
      mockPrisma.$queryRaw.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1500))
      );

      const quickHealth = await service.getQuickHealth();

      expect(quickHealth.status).toBe('degraded');
      expect(quickHealth.responseTime).toBeGreaterThan(1000);
    });
  });

  describe('isServiceAvailable', () => {
    it('should return true for healthy database', async () => {
      const isAvailable = await service.isServiceAvailable('database');
      expect(isAvailable).toBe(true);
    });

    it('should return false for unhealthy database', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

      const isAvailable = await service.isServiceAvailable('database');
      expect(isAvailable).toBe(false);
    });

    it('should cache service availability results', async () => {
      // First call
      await service.isServiceAvailable('database');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await service.isServiceAvailable('database');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', async () => {
      // Mock Date.now to control cache expiration
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);

      // First call
      await service.isServiceAvailable('database');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

      // Advance time beyond TTL (30 seconds)
      mockTime += 31000;

      // Second call should refresh cache
      await service.isServiceAvailable('database');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('getDegradationStatus', () => {
    it('should return full functionality when all services are healthy', async () => {
      const mockRedisInstance = {
        ping: jest.fn().mockResolvedValue('PONG'),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      const degradationStatus = await service.getDegradationStatus();

      expect(degradationStatus.canAcceptNewBookings).toBe(true);
      expect(degradationStatus.canProcessPayments).toBe(true);
      expect(degradationStatus.canSendNotifications).toBe(true);
      expect(degradationStatus.canUseCache).toBe(true);
      expect(degradationStatus.fallbackModes).toHaveLength(0);
    });

    it('should indicate limitations when services are down', async () => {
      // Mock Redis failure
      const mockRedisInstance = {
        ping: jest.fn().mockRejectedValue(new Error('Redis down')),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      // Mock Stripe failure
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const degradationStatus = await service.getDegradationStatus();

      expect(degradationStatus.canAcceptNewBookings).toBe(false);
      expect(degradationStatus.canProcessPayments).toBe(false);
      expect(degradationStatus.canUseCache).toBe(false);
      expect(degradationStatus.fallbackModes).toContain('no_caching');
      expect(degradationStatus.fallbackModes).toContain('payment_degraded');
    });

    it('should handle database failures appropriately', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database down'));

      const degradationStatus = await service.getDegradationStatus();

      expect(degradationStatus.canAcceptNewBookings).toBe(false);
      expect(degradationStatus.fallbackModes).toContain('read_only_mode');
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', () => {
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });

    it('should provide cache statistics', async () => {
      await service.isServiceAvailable('database');
      await service.isServiceAvailable('redis');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('service_database');
      expect(stats.keys).toContain('service_redis');
    });
  });

  describe('error handling', () => {
    it('should handle complete health check system failure', async () => {
      // Mock all services to fail
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Complete system failure'));
      
      const health = await service.getSystemHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.services.database.status).toBe('unhealthy');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return cached results when health check fails', async () => {
      // First successful call
      const firstHealth = await service.getSystemHealth();
      expect(firstHealth.status).toBe('healthy');

      // Mock failure for second call
      mockPrisma.$queryRaw.mockRejectedValue(new Error('System failure'));
      
      const secondHealth = await service.getSystemHealth();
      
      // Should return degraded status with cached data
      expect(secondHealth.status).toBe('degraded');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('cached health check result')
      );
    });
  });

  describe('performance monitoring', () => {
    it('should track response times', async () => {
      const health = await service.getSystemHealth();

      expect(health.metrics.response_time).toBeGreaterThan(0);
      expect(health.services.database.responseTime).toBeGreaterThan(0);
    });

    it('should calculate error rates', async () => {
      mockPrisma.errorLog.count.mockResolvedValue(15);

      const health = await service.getSystemHealth();

      expect(health.metrics.error_rate).toBe(3); // 15 errors / 5 minutes = 3 per minute
    });

    it('should monitor database connections', async () => {
      const health = await service.getSystemHealth();

      expect(health.metrics.database_connections).toBe(5);
      expect(health.services.database.details?.connections).toBeDefined();
    });
  });
});
