'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@mounasabet/ui';
import { Button } from '@mounasabet/ui';
import { Badge } from '@mounasabet/ui';
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2, 
  DollarSign,
  MapPin,
  Star,
  AlertCircle,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { Service } from '@/types';
import { useDataLoader } from '@/hooks/useDataLoader';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderServicesPage() {
  const { session } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch services using the useDataLoader hook
  const fetchServices = async () => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // First, get the provider ID for the current user
    const providerResponse = await fetch(`/api/provider?userId=${session.user.id}`);
    if (!providerResponse.ok) {
      throw new Error('Failed to get provider information');
    }
    
    const providerData = await providerResponse.json();
    if (!providerData.success || !providerData.provider) {
      throw new Error('Provider not found for current user');
    }

    const providerId = providerData.provider.id;
    
    // Now fetch the services for this provider
    const servicesResponse = await fetch(`/api/provider/services?providerId=${providerId}`);
    if (!servicesResponse.ok) {
      const errorData = await servicesResponse.json();
      throw new Error(errorData.error || 'Failed to fetch services');
    }
    
    const servicesData = await servicesResponse.json();
    if (!servicesData.success) {
      throw new Error(servicesData.error || 'Failed to fetch services');
    }
    
    return servicesData.services || [];
  };

  const { data: services, loading, error, isEmpty, refetch } = useDataLoader<Service[]>(
    fetchServices,
    [session?.user?.id]
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

      refetch(); // Refresh the list using the data loader
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

      refetch(); // Refresh the list using the data loader
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
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Services</h1>
          <Button asChild>
            <Link href="/provider/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Service
            </Link>
          </Button>
        </div>
        
        <EmptyState
          title="Failed to Load Services"
          description={error}
          icon={<AlertCircle className="h-12 w-12" />}
          action={{
            label: "Try Again",
            onClick: refetch,
            variant: "outline"
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Services</h1>
        <Button asChild>
          <Link href="/provider/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
          </Link>
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No services yet"
          description="Create your first service to start receiving bookings from customers."
          icon={<Package className="h-12 w-12" />}
          action={{
            label: "Create Your First Service",
            onClick: () => window.location.href = '/provider/services/new',
            variant: "default"
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {service.images && service.images.length > 0 ? (
                  <img
                    src={service.images[0]}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={service.isActive ? 'default' : 'secondary'}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="line-clamp-1">{service.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    {service.category}
                  </Badge>
                  {service.location && (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{service.location}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                    <span className="font-medium">
                      {service.basePrice ? 
                        `${service.basePrice} TND${service.priceUnit ? `/${service.priceUnit}` : ''}` : 
                        'Quote based'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm">4.8</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/provider/services/${service.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleServiceStatus(service.id, service.isActive)}
                    disabled={actionLoading === service.id}
                  >
                    {service.isActive ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteService(service.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={actionLoading === service.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}