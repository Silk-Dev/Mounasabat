
'use client';
import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  pricingType: 'FIXED' | 'QUOTE';
  basePrice?: number;
  priceUnit?: string;
  isActive: boolean;
  createdAt: string;
}

interface DataLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
}

function useDataLoader<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): DataLoadingState<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const isEmpty = !loading && !error && (!data || (Array.isArray(data) && data.length === 0));

  return {
    data,
    loading,
    error,
    isEmpty,
    refetch: fetchData,
  };
}

export default function ProviderServicesPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null); 

  // Get current user ID (in a real app, this would come from auth context)
  useEffect(() => {
    // For demo purposes, we'll use a mock user ID
    // In a real app, this would come from your auth system
    const mockUserId = 'demo-user-id';
    setCurrentUserId(mockUserId);
  }, []);

  // Get provider ID from user ID
  useEffect(() => {
    const getProviderId = async () => {
      if (!currentUserId) return;
      
      try {
        const response = await fetch(`/api/provider?userId=${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.provider) {
            setProviderId(data.provider.id);
          }
        }
      } catch (error) {
        console.error('Failed to get provider ID:', error);
      }
    };

    getProviderId();
  }, [currentUserId]);

  // Fetch services using the useDataLoader hook
  const fetchServices = async (): Promise<Service[]> => {
    if (!providerId) {
      throw new Error('Provider not found');
    }

    const response = await fetch(`/api/provider/services?providerId=${providerId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch services');
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch services');
    }
    
    return data.services || [];
  };

  const { data: services, loading, error, isEmpty, refetch } = useDataLoader<Service[]>(
    fetchServices,
    [providerId]
  );

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/provider/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service status');
      }

      refetch(); // Refresh the list
    } catch (error) {
      console.error('Error updating service status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update service status');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(serviceId);
      const response = await fetch(`/api/provider/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      refetch(); // Refresh the list
    } catch (error) {
      console.error('Error deleting service:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete service');
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state with proper skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="flex space-x-2">
              <div className="flex-grow h-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Manage Your Services</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Services</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Your Services</h1>
        <a 
          href="/provider/services/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Service
        </a>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">Create your first service to start receiving bookings from customers.</p>
          <a 
            href="/provider/services/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
          >
            Create Your First Service
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {service.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {service.basePrice ? 
                        `${service.basePrice} TND${service.priceUnit ? `/${service.priceUnit}` : ''}` : 
                        'Quote based'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.pricingType}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <a 
                    href={`/provider/services/${service.id}/edit`}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-center"
                  >
                    Edit
                  </a>
                  
                  <button
                    onClick={() => toggleServiceStatus(service.id, service.isActive)}
                    disabled={actionLoading === service.id}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {service.isActive ? 'Hide' : 'Show'}
                  </button>
                  
                  <button
                    onClick={() => deleteService(service.id)}
                    disabled={actionLoading === service.id}
                    className="px-3 py-2 text-sm border border-red-300 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
