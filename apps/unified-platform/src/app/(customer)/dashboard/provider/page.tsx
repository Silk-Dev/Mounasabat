'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { ProviderServicesTable } from './_components/services-table';
import { ServiceForm } from './_components/service-form';
import { StatsCards } from './_components/stats-cards';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  price: number | null;
  images: string[];
  createdAt: string;
  rejectionReason?: string;
}

export interface ProviderStats {
  totalServices: number;
  activeServices: number;
  pendingServices: number;
  rejectedServices: number;
}

export default function ProviderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [stats, setStats] = useState<ProviderStats>({
    totalServices: 0,
    activeServices: 0,
    pendingServices: 0,
    rejectedServices: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Check if user is a provider
      const checkProvider = async () => {
        try {
          const res = await fetch('/api/provider/check');
          if (!res.ok) {
            router.push('/dashboard');
            return;
          }
          fetchServices();
        } catch (error) {
          console.error('Error checking provider status:', error);
          router.push('/dashboard');
        }
      };
      checkProvider();
    }
  }, [status, session, router]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/provider/services');
      const data = await res.json();
      setServices(data);
      
      // Calculate stats
      const totalServices = data.length;
      const activeServices = data.filter((s: Service) => s.status === 'APPROVED').length;
      const pendingServices = data.filter((s: Service) => s.status === 'PENDING').length;
      const rejectedServices = data.filter((s: Service) => s.status === 'REJECTED').length;
      
      setStats({
        totalServices,
        activeServices,
        pendingServices,
        rejectedServices,
      });
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'status'>) => {
    try {
      const res = await fetch('/api/provider/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (res.ok) {
        await fetchServices();
        setIsFormOpen(false);
      } else {
        console.error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async (id: string, serviceData: Partial<Service>) => {
    try {
      const res = await fetch(`/api/provider/services?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (res.ok) {
        await fetchServices();
        setEditingService(null);
      } else {
        console.error('Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    
    try {
      const res = await fetch(`/api/provider/services?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchServices();
      } else {
        console.error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
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
        <h1 className="text-3xl font-bold">Tableau de bord prestataire</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Connecté en tant que {session?.user?.name}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="services">Mes services</TabsTrigger>
            <TabsTrigger value="profile">Mon profil</TabsTrigger>
          </TabsList>
          
          {(activeTab === 'services' || activeTab === 'overview') && (
            <Button onClick={() => {
              setEditingService(null);
              setIsFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un service
            </Button>
          )}
        </div>

        <TabsContent value="overview" className="space-y-4">
          <StatsCards stats={stats} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Derniers services</CardTitle>
                <CardDescription>
                  Vos 5 derniers services ajoutés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.slice(0, 5).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {service.images && service.images.length > 0 ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden">
                            <img
                              src={service.images[0]}
                              alt={service.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {service.title.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.category}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          service.status === 'APPROVED'
                            ? 'default'
                            : service.status === 'PENDING'
                            ? 'outline'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        {service.status === 'APPROVED'
                          ? 'Approuvé'
                          : service.status === 'PENDING'
                          ? 'En attente'
                          : 'Rejeté'}
                      </Badge>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun service trouvé. Commencez par en ajouter un.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Dernières mises à jour de vos services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services
                      .filter(s => s.status !== 'PENDING')
                      .slice(0, 3)
                      .map((service) => (
                        <div key={service.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{service.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Statut: {service.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                              </p>
                              {service.status === 'REJECTED' && service.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">
                                  Raison: {service.rejectionReason}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(service.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune notification pour le moment.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Mes services</CardTitle>
              <CardDescription>
                Gérez vos services proposés sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderServicesTable 
                services={services}
                onEdit={(service) => {
                  setEditingService(service);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteService}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>
                Gérez les informations de votre compte
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

      <ServiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={editingService}
        onSubmit={editingService ? 
          (data) => handleUpdateService(editingService.id, data) : 
          handleCreateService}
      />
    </div>
  );
}
