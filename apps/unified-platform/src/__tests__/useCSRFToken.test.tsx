import { renderHook, waitFor } from '@testing-library/react';
import { useCSRFToken, useSecureAPI } from '@/hooks/useCSRFToken';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('useCSRFToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should fetch CSRF token on mount', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'test-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'test-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useCSRFToken());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.token).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe('test-token');
    expect(result.current.secret).toBe('test-secret');
    expect(result.current.error).toBe(null);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'csrf-token-data',
      expect.stringContaining('test-token')
    );
  });

  it('should load token from sessionStorage if valid', async () => {
    const tokenData = {
      token: 'stored-token',
      secret: 'stored-secret',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    };
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(tokenData));

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe('stored-token');
    expect(result.current.secret).toBe('stored-secret');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch new token if stored token is expired', async () => {
    const expiredTokenData = {
      token: 'expired-token',
      secret: 'expired-secret',
      expires: Date.now() - 60 * 60 * 1000, // 1 hour ago
    };
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(expiredTokenData));

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'new-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'new-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.secret).toBe('new-secret');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('csrf-token-data');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe(null);
    expect(result.current.secret).toBe(null);
    expect(result.current.error).toContain('Network error');
  });

  it('should handle invalid response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' }), // Missing secret
      headers: {
        get: () => null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe(null);
    expect(result.current.error).toContain('Invalid CSRF token response');
  });

  it('should provide correct headers', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'test-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'test-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const headers = result.current.getHeaders();
    expect(headers).toEqual({
      'X-CSRF-Token': 'test-token',
      'X-CSRF-Secret': 'test-secret',
    });
  });

  it('should refresh token manually', async () => {
    // Initial fetch
    const mockResponse1 = {
      ok: true,
      json: () => Promise.resolve({
        token: 'initial-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'initial-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse1 as any);

    const { result } = renderHook(() => useCSRFToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe('initial-token');

    // Refresh token
    const mockResponse2 = {
      ok: true,
      json: () => Promise.resolve({
        token: 'refreshed-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'refreshed-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockResponse2 as any);

    await result.current.refreshToken();

    await waitFor(() => {
      expect(result.current.token).toBe('refreshed-token');
    });

    expect(result.current.secret).toBe('refreshed-secret');
  });
});

describe('useSecureAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should make secure requests with CSRF headers', async () => {
    // Mock CSRF token fetch
    const mockCSRFResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'test-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'test-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockCSRFResponse as any);

    // Mock API request
    const mockAPIResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    };
    mockFetch.mockResolvedValueOnce(mockAPIResponse as any);

    const { result } = renderHook(() => useSecureAPI());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const response = await result.current.securePost('/api/test', { data: 'test' });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'test-token',
        'X-CSRF-Secret': 'test-secret',
      },
      body: JSON.stringify({ data: 'test' }),
      credentials: 'include',
    });
  });

  it('should make secure PUT requests', async () => {
    // Mock CSRF token fetch
    const mockCSRFResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'test-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'test-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockCSRFResponse as any);

    // Mock API request
    const mockAPIResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    };
    mockFetch.mockResolvedValueOnce(mockAPIResponse as any);

    const { result } = renderHook(() => useSecureAPI());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.securePut('/api/test/1', { data: 'updated' });

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'test-token',
        'X-CSRF-Secret': 'test-secret',
      },
      body: JSON.stringify({ data: 'updated' }),
      credentials: 'include',
    });
  });

  it('should make secure DELETE requests', async () => {
    // Mock CSRF token fetch
    const mockCSRFResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'test-token',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      headers: {
        get: (name: string) => name === 'X-CSRF-Secret' ? 'test-secret' : null,
      },
    };
    mockFetch.mockResolvedValueOnce(mockCSRFResponse as any);

    // Mock API request
    const mockAPIResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true }),
    };
    mockFetch.mockResolvedValueOnce(mockAPIResponse as any);

    const { result } = renderHook(() => useSecureAPI());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.secureDelete('/api/test/1');

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'test-token',
        'X-CSRF-Secret': 'test-secret',
      },
      credentials: 'include',
    });
  });
});