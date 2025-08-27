import Link from 'next/link';
import { LogOut, LayoutDashboard, Calendar, Settings, CalendarCheck, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export function ProviderSidebar() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/provider/login' });
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-gray-800">Espace Prestataire</h1>
      </div>
      <nav className="mt-6">
        <div className="px-4 space-y-1">
          <Link
            href="/provider/dashboard"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Tableau de bord
          </Link>
          <Link
            href="/provider/bookings"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Réservations
          </Link>
          <Link
            href="/provider/availability"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <CalendarCheck className="w-5 h-5 mr-3" />
            Disponibilités
          </Link>
          <Link
            href="/provider/reviews"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Star className="w-5 h-5 mr-3" />
            Avis
          </Link>
          <Link
            href="/provider/messages"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Messages
          </Link>
          <Link
            href="/provider/settings"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 mr-3" />
            Paramètres
          </Link>
        </div>
      </nav>
      <div className="absolute bottom-0 w-64 p-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="flex items-center w-full text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
