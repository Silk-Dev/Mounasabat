import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  withGracefulDegradation,
  isFeatureAvailable,
  getFallbackData,
  executeWithFallback,
  fetchWithCacheFallback,
  processPaymentWithFallback,
  executeDbOperationWithFallback,
  ServiceAvailability,
} from '../graceful-degradation';
import { healthCheckService } from '../health-check-service';
import { logger } from '../production-logger';

// Mock dependencies
jest.mock('../health-check-service');
jest.mock('../production-logger');
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

const mockHealthCheckService = healthCheckService as jest.Mocked<typeof healthCheckService>;

describe('Graceful Degradation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default to all services available
    mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
      return Promise.resolve(true);
    });
    
    mockHealthCheckService.getDegradationStatus.mockResolvedValue({
      canAcceptNewBookings: true,
      canProcessPayments: true,
      canSendNotifications: true,
      canUseCache: true,
      fallbackModes: [],
    });
  });

  describe('withGracefulDegradation middleware', () => {
    const mockHandler = jest.fn();
    const mockRequest = new NextRequest('http://localhost:3000/api/test');

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));
    });

    it('should call handler when all required services are available', async () => {
      const middleware = withGracefulDegradation(mockHandler, {
        requireDatabase: true,
        requireStripe: true,
      });

      const response = await middleware(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should return service unavailable when required database is down', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'database');
      });

      const middleware = withGracefulDegradation(mockHandler, {
        requireDatabase: true,
      });

      const response = await middleware(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(503);
      
      const responseData = await response.json();
      expect(responseData.error).toBe('Service Unavailable');
      expect(responseData.message).toContain('Database service');
    });

    it('should return service unavailable when required Stripe is down', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'stripe');
      });

      const middleware = withGracefulDegradation(mockHandler, {
        requireStripe: true,
      });

      const response = await middleware(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(503);
      
      const responseData = await response.json();
      expect(responseData.message).toContain('Payment service');
    });

    it('should continue with graceful fallback when services are down', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'redis');
      });

      const middleware = withGracefulDegradation(mockHandler, {
        requireRedis: true,
        gracefulFallback: true,
      });

      const response = await middleware(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.headers.get('x-cache-status')).toBe('disabled');
    });

    it('should add service availability headers to request', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'redis');
      });

      const middleware = withGracefulDegradation(mockHandler, {
        requireDatabase: true,
      });

      await middleware(mockRequest);

      expect(mockHandler).toHaveBeenCalled();
      const enhancedRequest = mockHandler.mock.calls[0][0];
      expect(enhancedRequest.headers.get('x-service-database')).toBe('true');
      expect(enhancedRequest.headers.get('x-service-redis')).toBe('false');
    });

    it('should return fallback response when provided', async () => {
      const fallbackResponse = { message: 'Fallback data', data: [] };
      
      mockHandler.mockRejectedValue(new Error('Handler failed'));

      const middleware = withGracefulDegradation(mockHandler, {
        fallbackResponse,
      });

      const response = await middleware(mockRequest);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual(fallbackResponse);
    });
  });

  describe('isFeatureAvailable', () => {
    it('should return true for booking when services are available', async () => {
      const available = await isFeatureAvailable('booking');
      expect(available).toBe(true);
    });

    it('should return false for booking when services are unavailable', async () => {
      mockHealthCheckService.getDegradationStatus.mockResolvedValue({
        canAcceptNewBookings: false,
        canProcessPayments: true,
        canSendNotifications: true,
        canUseCache: true,
        fallbackModes: ['payment_degraded'],
      });

      const available = await isFeatureAvailable('booking');
      expect(available).toBe(false);
    });

    it('should return false for payment when Stripe is down', async () => {
      mockHealthCheckService.getDegradationStatus.mockResolvedValue({
        canAcceptNewBookings: true,
        canProcessPayments: false,
        canSendNotifications: true,
        canUseCache: true,
        fallbackModes: ['payment_degraded'],
      });

      const available = await isFeatureAvailable('payment');
      expect(available).toBe(false);
    });

    it('should return true for unknown features', async () => {
      const available = await isFeatureAvailable('unknown_feature');
      expect(available).toBe(true);
    });
  });

  describe('getFallbackData', () => {
    it('should return primary data when fetcher succeeds', async () => {
      const primaryData = { id: 1, name: 'Primary' };
      const fallbackData = { id: 2, name: 'Fallback' };
      const fetcher = jest.fn().mockResolvedValue(primaryData);

      const result = await getFallbackData(fetcher, fallbackData);

      expect(result).toEqual(primaryData);
      expect(fetcher).toHaveBeenCalled();
    });

    it('should return fallback data when fetcher fails', async () => {
      const fallbackData = { id: 2, name: 'Fallback' };
      const fetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      const result = await getFallbackData(fetcher, fallbackData, 'test-service');

      expect(result).toEqual(fallbackData);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Primary data fetch failed'),
        expect.any(Error)
      );
    });
  });

  describe('executeWithFallback', () => {
    it('should execute primary action when it succeeds', async () => {
      const primaryResult = 'primary-result';
      const primaryAction = jest.fn().mockResolvedValue(primaryResult);
      const fallbackAction = jest.fn().mockResolvedValue('fallback-result');

      const result = await executeWithFallback(primaryAction, fallbackAction);

      expect(result).toBe(primaryResult);
      expect(primaryAction).toHaveBeenCalled();
      expect(fallbackAction).not.toHaveBeenCalled();
    });

    it('should execute fallback action when primary fails', async () => {
      const fallbackResult = 'fallback-result';
      const primaryAction = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackAction = jest.fn().mockResolvedValue(fallbackResult);

      const result = await executeWithFallback(primaryAction, fallbackAction, 'test-service');

      expect(result).toBe(fallbackResult);
      expect(primaryAction).toHaveBeenCalled();
      expect(fallbackAction).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Primary action failed'),
        expect.any(Error)
      );
    });
  });

  describe('fetchWithCacheFallback', () => {
    const mockRedis = require('ioredis').Redis;

    it('should return cached data when available', async () => {
      const cachedData = { id: 1, cached: true };
      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue(JSON.stringify(cachedData)),
        setex: jest.fn(),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      const dataFetcher = jest.fn().mockResolvedValue({ id: 1, fresh: true });

      const result = await fetchWithCacheFallback('test-key', dataFetcher);

      expect(result).toEqual(cachedData);
      expect(dataFetcher).not.toHaveBeenCalled();
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should fetch and cache data when cache miss', async () => {
      const freshData = { id: 1, fresh: true };
      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn(),
        disconnect: jest.fn(),
      };
      mockRedis.mockImplementation(() => mockRedisInstance);

      const dataFetcher = jest.fn().mockResolvedValue(freshData);

      const result = await fetchWithCacheFallback('test-key', dataFetcher);

      expect(result).toEqual(freshData);
      expect(dataFetcher).toHaveBeenCalled();
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(freshData)
      );
    });

    it('should fallback to direct fetch when Redis is unavailable', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'redis');
      });

      const freshData = { id: 1, fresh: true };
      const dataFetcher = jest.fn().mockResolvedValue(freshData);

      const result = await fetchWithCacheFallback('test-key', dataFetcher);

      expect(result).toEqual(freshData);
      expect(dataFetcher).toHaveBeenCalled();
      expect(mockRedis).not.toHaveBeenCalled();
    });

    it('should return fallback data when both cache and fetcher fail', async () => {
      const fallbackData = { id: 1, fallback: true };
      const dataFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'redis');
      });

      const result = await fetchWithCacheFallback('test-key', dataFetcher, fallbackData);

      expect(result).toEqual(fallbackData);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Data fetch failed'),
        expect.any(Error)
      );
    });
  });

  describe('processPaymentWithFallback', () => {
    it('should process payment normally when Stripe is available', async () => {
      const paymentData = { amount: 1000, currency: 'usd' };

      const result = await processPaymentWithFallback(paymentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(paymentData);
      expect(result.fallback).toBeUndefined();
    });

    it('should use fallback handler when Stripe is unavailable', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'stripe');
      });

      const paymentData = { amount: 1000, currency: 'usd' };
      const fallbackResult = { id: 'fallback-payment', status: 'pending' };
      const fallbackHandler = jest.fn().mockResolvedValue(fallbackResult);

      const result = await processPaymentWithFallback(paymentData, fallbackHandler);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fallbackResult);
      expect(result.fallback).toBe(true);
      expect(fallbackHandler).toHaveBeenCalled();
    });

    it('should return failure when Stripe is down and no fallback', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'stripe');
      });

      const paymentData = { amount: 1000, currency: 'usd' };

      const result = await processPaymentWithFallback(paymentData);

      expect(result.success).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Payment processing unavailable')
      );
    });
  });

  describe('executeDbOperationWithFallback', () => {
    it('should execute write operation when database is available', async () => {
      const writeResult = { id: 1, created: true };
      const writeOperation = jest.fn().mockResolvedValue(writeResult);
      const readOnlyFallback = jest.fn();

      const result = await executeDbOperationWithFallback(writeOperation, readOnlyFallback);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(writeResult);
      expect(result.readOnly).toBeUndefined();
      expect(writeOperation).toHaveBeenCalled();
      expect(readOnlyFallback).not.toHaveBeenCalled();
    });

    it('should use read-only fallback when database is unavailable', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'database');
      });

      const readOnlyResult = { id: 1, readOnly: true };
      const writeOperation = jest.fn();
      const readOnlyFallback = jest.fn().mockResolvedValue(readOnlyResult);

      const result = await executeDbOperationWithFallback(writeOperation, readOnlyFallback);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(readOnlyResult);
      expect(result.readOnly).toBe(true);
      expect(writeOperation).not.toHaveBeenCalled();
      expect(readOnlyFallback).toHaveBeenCalled();
    });

    it('should return failure when database is down and no fallback', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'database');
      });

      const writeOperation = jest.fn();

      const result = await executeDbOperationWithFallback(writeOperation);

      expect(result.success).toBe(false);
      expect(writeOperation).not.toHaveBeenCalled();
    });
  });

  describe('ServiceAvailability utility', () => {
    it('should check individual service availability', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service === 'database');
      });

      const dbAvailable = await ServiceAvailability.database();
      const redisAvailable = await ServiceAvailability.redis();

      expect(dbAvailable).toBe(true);
      expect(redisAvailable).toBe(false);
    });

    it('should check all services availability', async () => {
      mockHealthCheckService.isServiceAvailable.mockImplementation((service) => {
        return Promise.resolve(service !== 'stripe');
      });

      const allServices = await ServiceAvailability.all();

      expect(allServices.database).toBe(true);
      expect(allServices.redis).toBe(true);
      expect(allServices.stripe).toBe(false);
      expect(allServices.external_apis).toBe(true);
    });
  });
});