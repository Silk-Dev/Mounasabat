import type { Service, Provider } from '../types';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServicesResponse {
  success: boolean;
  services: Service[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export interface ProvidersResponse {
  success: boolean;
  providers: Provider[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export async function fetchServices(params?: {
  limit?: number;
  offset?: number;
  category?: string;
  sortBy?: string;
}): Promise<Service[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.category) searchParams.set('category', params.category);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

  const response = await fetch(`/api/services?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }

  const data: ServicesResponse = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch services');
  }

  return data.services;
}

export async function fetchProviders(params?: {
  limit?: number;
  offset?: number;
  verified?: boolean;
  sortBy?: string;
}): Promise<Provider[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.verified !== undefined) searchParams.set('verified', params.verified.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

  const response = await fetch(`/api/providers?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch providers: ${response.statusText}`);
  }

  const data: ProvidersResponse = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch providers');
  }

  return data.providers;
}

// API Client class for centralized request handling
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    url: string,
    options: RequestInit = {},
    retryConfig?: { maxRetries?: number; delay?: number }
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000 } = retryConfig || {};
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${url}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          throw new APIError(
            `Request failed: ${response.statusText}`,
            response.status,
            await response.text()
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error instanceof APIError ? error : new APIError(String(error));
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw new APIError('Max retries exceeded');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
