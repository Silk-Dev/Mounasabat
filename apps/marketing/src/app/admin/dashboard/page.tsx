import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Package, CreditCard } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Utilisateurs',
      value: '1,234',
      icon: Users,
      description: '+12% depuis le mois dernier',
    },
    {
      title: 'Réservations',
      value: '256',
      icon: Calendar,
      description: '+8% depuis le mois dernier',
    },
    {
      title: 'Prestataires',
      value: '89',
      icon: Package,
      description: '+5% depuis le mois dernier',
    },
    {
      title: 'Revenus',
      value: '12,540 €',
      icon: CreditCard,
      description: '+18% depuis le mois dernier',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Tableau de bord</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">Nouvelle réservation #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground">Il y a {i} heure{i > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-medium">{(i * 250).toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des prestataires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'En attente', value: 12, color: 'bg-yellow-500' },
                { name: 'Approuvés', value: 45, color: 'bg-green-500' },
                { name: 'Suspendus', value: 5, color: 'bg-red-500' },
              ].map((status, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{status.name}</span>
                    <span className="text-sm text-muted-foreground">{status.value}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status.color} rounded-full`} 
                      style={{ width: `${(status.value / 62) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
