import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Star, Users, CreditCard } from 'lucide-react';

export default function ProviderDashboard() {
  const stats = [
    {
      title: 'Réservations du jour',
      value: '8',
      icon: Calendar,
      description: '+2 par rapport à hier',
    },
    {
      title: 'En attente',
      value: '3',
      icon: Clock,
      description: 'Nécessite votre attention',
    },
    {
      title: 'Note moyenne',
      value: '4.8',
      icon: Star,
      description: 'Sur 5.0 (124 avis)',
    },
    {
      title: 'Revenus du mois',
      value: '3,245 €',
      icon: CreditCard,
      description: '+15% par rapport au mois dernier',
    },
  ];

  const upcomingBookings = [
    { id: 1, customer: 'Marie Dupont', service: 'Photographie', date: 'Aujourd\'hui, 14:30', status: 'Confirmé' },
    { id: 2, customer: 'Thomas Martin', service: 'Traiteur', date: 'Demain, 11:00', status: 'Confirmé' },
    { id: 3, customer: 'Sophie Leroy', service: 'Décoration', date: 'Demain, 16:45', status: 'En attente' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="flex space-x-4">
          <button className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50">
            Exporter les données
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Nouvelle prestation
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-indigo-600" />
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
            <CardTitle>Prochaines réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{booking.customer}</p>
                      <p className="text-sm text-gray-500">{booking.service}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'Confirmé' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {booking.date}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button className="text-xs text-indigo-600 hover:underline">Voir les détails</button>
                    <button className="text-xs text-gray-500 hover:underline">Décliner</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques des réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Confirmées', value: 65, color: 'bg-green-500' },
                { name: 'En attente', value: 15, color: 'bg-yellow-500' },
                { name: 'Annulées', value: 20, color: 'bg-red-500' },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.name}</span>
                    <span className="text-sm text-muted-foreground">{stat.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} rounded-full`} 
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Prochaines disponibilités</h3>
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                  <div key={i} className="p-2 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <div 
                    key={i + 7} 
                    className={`p-2 rounded-full ${
                      [0, 1, 6, 7, 8, 13].includes(i) 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-white border border-indigo-200 hover:bg-indigo-50 cursor-pointer'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
