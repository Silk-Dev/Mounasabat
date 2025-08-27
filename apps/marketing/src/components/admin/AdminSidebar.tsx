import Link from 'next/link';
import { LogOut, LayoutDashboard, Users, Settings, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export function AdminSidebar() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
      </div>
      <nav className="mt-6">
        <div className="px-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Tableau de bord
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Users className="w-5 h-5 mr-3" />
            Utilisateurs
          </Link>
          <Link
            href="/admin/providers"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Package className="w-5 h-5 mr-3" />
            Prestataires
          </Link>
          <Link
            href="/admin/bookings"
            className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Réservations
          </Link>
          <Link
            href="/admin/settings"
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
