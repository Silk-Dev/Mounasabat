'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { useAuth, useRole } from '@/lib/auth-context';
import { Button } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui';
import { User, LogOut, Settings, BarChart3, Users, Shield, Cog, Star, FileText } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function AdminHeader() {
  const { session, signOut, isLoading } = useAuth();
  const { isAdmin } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session && !isAdmin) {
      // Redirect non-admins away from admin dashboard
      router.push('/');
    }
  }, [session, isAdmin, isLoading, router]);

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
              Mounasabet Admin
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/admin/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/admin/providers" className="flex items-center text-gray-600 hover:text-gray-900">
                <Shield className="mr-2 h-4 w-4" />
                Providers
              </Link>
              <Link href="/admin/users" className="flex items-center text-gray-600 hover:text-gray-900">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
              <Link href="/admin/reviews" className="flex items-center text-gray-600 hover:text-gray-900">
                <Star className="mr-2 h-4 w-4" />
                Reviews
              </Link>
              <Link href="/admin/audit-logs" className="flex items-center text-gray-600 hover:text-gray-900">
                <FileText className="mr-2 h-4 w-4" />
                Audit Logs
              </Link>
              <Link href="/admin/monitoring" className="flex items-center text-gray-600 hover:text-gray-900">
                <BarChart3 className="mr-2 h-4 w-4" />
                Monitoring
              </Link>
              <Link href="/admin/platform" className="flex items-center text-gray-600 hover:text-gray-900">
                <Cog className="mr-2 h-4 w-4" />
                Platform
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
                    <p className="text-xs text-red-600 font-medium">Admin Account</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const { isAdmin } = useRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need an admin account to access this area.</p>
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
      <AdminHeader />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}