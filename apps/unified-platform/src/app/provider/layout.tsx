'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { useAuth, useRole } from '@/lib/auth-context';
import { Button } from '@mounasabet/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@mounasabet/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@mounasabet/ui';
import { User, LogOut, Settings, BarChart3, Calendar, Package, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function ProviderHeader() {
  const { session, signOut, isLoading } = useAuth();
  const { isProvider } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session && !isProvider) {
      // Redirect non-providers away from provider dashboard
      router.push('/');
    }
  }, [session, isProvider, isLoading, router]);

  if (!session || !isProvider) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/provider/dashboard" className="text-2xl font-bold text-primary">
              Mounasabet Provider
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/provider/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/provider/services" className="flex items-center text-gray-600 hover:text-gray-900">
                <Package className="mr-2 h-4 w-4" />
                Services
              </Link>
              <Link href="/provider/bookings" className="flex items-center text-gray-600 hover:text-gray-900">
                <Calendar className="mr-2 h-4 w-4" />
                Bookings
              </Link>
              <Link href="/provider/availability" className="flex items-center text-gray-600 hover:text-gray-900">
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Link>
              <Link href="/provider/analytics" className="flex items-center text-gray-600 hover:text-gray-900">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/">View Customer Site</Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image} alt={session.user.name} />
                    <AvatarFallback>
                      {session.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Provider Account</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/provider/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/provider/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const { isProvider } = useRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need a provider account to access this area.</p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderHeader />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}