import { useState, useEffect } from 'react';
import { logger } from '@/lib/production-logger';

interface CSRFTokenData {
  token: string;
  secret: string;
  expires: number;
}

interface UseCSRFTokenReturn {
  token: string | null;
  secret: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

export function useCSRFToken(): UseCSRFTokenReturn {
  const [tokenData, setTokenData] = useState<CSRFTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      const secret = response.headers.get('X-CSRF-Secret');

      if (!data.token || !secret) {
        throw new Error('Invalid CSRF token response');
      }

      const tokenData: CSRFTokenData = {
        token: data.token,
        secret,
        expires: data.expires,
      };

      setTokenData(tokenData);
      
      // Store in sessionStorage for persistence across page reloads
      sessionStorage.setItem('csrf-token-data', JSON.stringify(tokenData));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      logger.error('CSRF token fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    await fetchToken();
  };

  const getHeaders = (): Record<string, string> => {
    if (!tokenData) {
      return {};
    }

    return {
      'X-CSRF-Token': tokenData.token,
      'X-CSRF-Secret': tokenData.secret,
    };
  };

  useEffect(() => {
    // Try to load from sessionStorage first
    const storedData = sessionStorage.getItem('csrf-token-data');
    if (storedData) {
      try {
        const parsed: CSRFTokenData = JSON.parse(storedData);
        
        // Check if token is still valid (not expired)
        if (parsed.expires > Date.now()) {
          setTokenData(parsed);
          setIsLoading(false);
          return;
        } else {
          // Token expired, remove from storage
          sessionStorage.removeItem('csrf-token-data');
        }
      } catch (err) {
        // Invalid stored data, remove it
        sessionStorage.removeItem('csrf-token-data');
      }
    }

    // Fetch new token
    fetchToken();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!tokenData) return;

    const timeUntilExpiry = tokenData.expires - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // Refresh 5 minutes before expiry, but at least in 1 minute

    const timer = setTimeout(() => {
      fetchToken();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [tokenData]);

  return {
    token: tokenData?.token || null,
    secret: tokenData?.secret || null,
    isLoading,
    error,
    refreshToken,
    getHeaders,
  };
}

// Hook for making secure API requests with CSRF protection
export function useSecureAPI() {
  const { getHeaders, isLoading: csrfLoading } = useCSRFToken();

  const secureRequest = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = {
      'Content-Type': 'application/json',
      ...getHeaders(),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  const securePost = async (url: string, data: any, options: RequestInit = {}): Promise<Response> => {
    return secureRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  };

  const securePut = async (url: string, data: any, options: RequestInit = {}): Promise<Response> => {
    return secureRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  };

  const secureDelete = async (url: string, options: RequestInit = {}): Promise<Response> => {
    return secureRequest(url, {
      method: 'DELETE',
      ...options,
    });
  };

  return {
    secureRequest,
    securePost,
    securePut,
    secureDelete,
    isLoading: csrfLoading,
  };
}