'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProvidersTable } from './_components/providers-table';
import { ServicesTable } from './_components/services-table';
import { StatsCards } from './_components/stats-cards';
import { createAuthClient } from 'better-auth/react';

interface Provider {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
  };
  _count: {
    services: number;
  };
}

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  price: number | null;
  images: string[];
  createdAt: string;
  provider: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function AdminDashboard() {
  const {useSession} = createAuthClient();
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    pendingServices: 0,
    totalServices: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Check if user is admin
      const checkAdmin = async () => {
        try {
          const res = await fetch('/api/admin/check');
          if (!res.ok) {
            router.push('/dashboard');
            return;
          }
          fetchData();
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/dashboard');
        }
      };
      checkAdmin();
    }
  }, [session, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch providers
      const providersRes = await fetch('/api/admin/providers');
      const providersData = await providersRes.json();
      setProviders(providersData);

      // Fetch pending services
      const servicesRes = await fetch('/api/admin/services?status=PENDING');
      const servicesData = await servicesRes.json();
      setServices(servicesData);

      // Calculate stats
      const totalProviders = providersData.length;
      const activeProviders = providersData.filter((p: Provider) => p.status === 'ACTIVE').length;
      const pendingServices = servicesData.length;
      const totalServicesRes = await fetch('/api/admin/services');
      const totalServicesData = await totalServicesRes.json();
      const totalServices = totalServicesData.length;

      setStats({
        totalProviders,
        activeProviders,
        pendingServices,
        totalServices,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProviderStatus = async (providerId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId, status }),
      });

      if (res.ok) {
        // Update local state
        setProviders(prev =>
          prev.map(provider =>
            provider.id === providerId ? { ...provider, status } : provider
          )
        );
      } else {
        console.error('Failed to update provider status');
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
    }
  };

  const handleUpdateServiceStatus = async (serviceId: string, status: string, rejectionReason?: string) => {
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId, status, rejectionReason }),
      });

      if (res.ok) {
        // Update local state
        setServices(prev => prev.filter(service => service.id !== serviceId));
        // Refresh stats
        fetchData();
      } else {
        console.error('Failed to update service status');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Connecté en tant que {session?.user?.name}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="providers">Prestataires</TabsTrigger>
          <TabsTrigger value="services">Services en attente</TabsTrigger>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StatsCards stats={stats} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Derniers prestataires</CardTitle>
                <CardDescription>
                  Les 5 derniers prestataires inscrits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providers.slice(0, 5).map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {provider.user.image ? (
                            <img
                              src={provider.user.image}
                              alt={provider.user.name}
                              className="h-full w-full rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {provider.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{provider.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.user.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={provider.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {provider.status.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services en attente</CardTitle>
                <CardDescription>
                  Les derniers services en attente de validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.length > 0 ? (
                    services.slice(0, 5).map((service) => (
                      <div key={service.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{service.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Par {service.provider.user.name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateServiceStatus(service.id, 'APPROVED')}
                            >
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Raison du rejet :');
                                if (reason) {
                                  handleUpdateServiceStatus(service.id, 'REJECTED', reason);
                                }
                              }}
                            >
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun service en attente de validation
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers">
          <ProvidersTable 
            providers={providers} 
            onUpdateStatus={handleUpdateProviderStatus} 
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTable 
            services={services}
            onUpdateStatus={handleUpdateServiceStatus}
          />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Signalements</CardTitle>
              <CardDescription>
                Gérer les signalements des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cette fonctionnalité sera bientôt disponible.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
