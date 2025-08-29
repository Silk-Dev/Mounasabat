import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, useApiRequest } from '../hooks/useErrorHandler';
import { apiClient } from '../api-client';
import { errorLogger } from '../error-logger';

// Mock dependencies
jest.mock('../api-client');
jest.mock('../error-logger');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockErrorLogger = errorLogger as jest.Mocked<typeof errorLogger>;

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('useErrorHandler', () => {
    it('should handle errors correctly', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => 
        useErrorHandler({ onError, section: 'test' })
      );

      const testError = new Error('Test error');
      
      await act(async () => {
        await result.current.execute(async () => {
          throw testError;
        });
      });

      expect(result.current.error).toBe(testError);
      expect(onError).toHaveBeenCalledWith(testError);
      expect(mockErrorLogger.logError).toHaveBeenCalledWith(
        testError,
        'error',
        { section: 'test' }
      );
    });

    it('should retry failed operations', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('Success');

      const { result } = renderHook(() => 
        useErrorHandler({ maxRetries: 3 })
      );

      let finalResult;
      await act(async () => {
        finalResult = await result.current.executeWithRetry(mockFn);
      });

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(finalResult).toBe('Success');
      expect(result.current.error).toBeNull();
    });

    it('should stop retrying after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      const { result } = renderHook(() => 
        useErrorHandler({ maxRetries: 2 })
      );

      let finalResult;
      await act(async () => {
        finalResult = await result.current.executeWithRetry(mockFn);
      });

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(finalResult).toBeNull();
      expect(result.current.error).toEqual(new Error('Persistent failure'));
    });

    it('should reset error state', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('useApiRequest', () => {
    it('should make successful API requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockApiClient.request.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useApiRequest());

      let response;
      await act(async () => {
        response = await result.current.get('/api/test');
      });

      expect(response).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle API errors', async () => {
      const apiError = {
        code: 'API_ERROR',
        message: 'API request failed',
        status: 500,
        timestamp: new Date(),
        requestId: 'test-id',
      };
      mockApiClient.request.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useApiRequest());

      await act(async () => {
        try {
          await result.current.get('/api/test');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toEqual(apiError);
      expect(result.current.data).toBeNull();
      expect(mockErrorLogger.logAPIError).toHaveBeenCalledWith(
        '/api/test',
        'GET',
        500,
        undefined
      );
    });

    it('should reset state correctly', () => {
      const { result } = renderHook(() => useApiRequest());

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('API Client Retry Logic', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      global.crypto = {
        randomUUID: jest.fn(() => 'test-uuid'),
      } as any;
    });

    it('should retry on retryable errors', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First call fails with 500, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response);

      const result = await apiClient.request('/api/test', {}, {
        maxAttempts: 2,
        baseDelay: 10, // Short delay for testing
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    it('should not retry on non-retryable errors', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(
        apiClient.request('/api/test', {}, { maxAttempts: 3 })
      ).rejects.toMatchObject({
        code: 'HTTP_ERROR',
        status: 400,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      const startTime = Date.now();
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response);

      await apiClient.request('/api/test', {}, {
        maxAttempts: 3,
        baseDelay: 100,
        backoffStrategy: 'exponential',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have waited at least 100ms + 200ms (exponential backoff)
      expect(duration).toBeGreaterThan(250);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Logger', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      Object.defineProperty(window, 'navigator', {
        value: { userAgent: 'test-agent' },
        writable: true,
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'http://test.com' },
        writable: true,
      });
    });

    it('should log errors to server', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const testError = new Error('Test error');
      await errorLogger.logError(testError, 'error', { section: 'test' });

      // Wait for async logging
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test error'),
      });
    });

    it('should store errors locally when offline', async () => {
      const mockSetItem = localStorage.setItem as jest.MockedFunction<typeof localStorage.setItem>;
      
      // Simulate offline
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      const testError = new Error('Offline error');
      await errorLogger.logError(testError);

      // Should store locally instead of sending to server
      expect(mockSetItem).toHaveBeenCalledWith(
        'errorLogs',
        expect.stringContaining('Offline error')
      );
    });

    it('should deduplicate similar errors', async () => {
      const testError1 = new Error('Duplicate error');
      const testError2 = new Error('Duplicate error');

      await errorLogger.logError(testError1, 'error', { section: 'test' });
      await errorLogger.logError(testError2, 'error', { section: 'test' });

      const storedErrors = errorLogger.getStoredErrors();
      const duplicateErrors = storedErrors.filter(e => e.message === 'Duplicate error');
      
      expect(duplicateErrors).toHaveLength(1);
      expect(duplicateErrors[0].count).toBe(2);
    });
  });

  describe('Specialized Error Handlers', () => {
    it('should clear search cache on search errors', () => {
      const mockRemoveItem = localStorage.removeItem as jest.MockedFunction<typeof localStorage.removeItem>;
      
      const { result } = renderHook(() => 
        useErrorHandler({
          section: 'search',
          onError: () => {
            localStorage.removeItem('searchCache');
          },
        })
      );

      act(() => {
        result.current.handleError(new Error('Search failed'));
      });

      expect(mockRemoveItem).toHaveBeenCalledWith('searchCache');
    });

    it('should save booking progress on booking errors', () => {
      const mockSetItem = localStorage.setItem as jest.MockedFunction<typeof localStorage.setItem>;
      const mockGetItem = sessionStorage.getItem as jest.MockedFunction<typeof sessionStorage.getItem>;
      
      mockGetItem.mockReturnValue('{"step": "payment", "data": "test"}');

      const { result } = renderHook(() => 
        useErrorHandler({
          section: 'booking',
          onError: () => {
            const bookingProgress = sessionStorage.getItem('bookingProgress');
            if (bookingProgress) {
              localStorage.setItem('savedBooking', bookingProgress);
              localStorage.setItem('savedBookingTimestamp', Date.now().toString());
            }
          },
        })
      );

      act(() => {
        result.current.handleError(new Error('Booking failed'));
      });

      expect(mockSetItem).toHaveBeenCalledWith('savedBooking', '{"step": "payment", "data": "test"}');
      expect(mockSetItem).toHaveBeenCalledWith('savedBookingTimestamp', expect.any(String));
    });
  });
});
