'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@mounasabet/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@mounasabet/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@mounasabet/ui';
import { User, LogOut, Settings, Heart, Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notifications';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

function CustomerHeader() {
  const { session, signOut, isLoading } = useAuth();
  const isMobile = useIsMobile();

  // Mobile header is handled by MobileHeader component
  if (isMobile) {
    return <MobileHeader />;
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Mounasabet
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
              Search
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">
              Categories
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <>
                <NotificationBell />
              </>
            ) : null}
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
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
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/customer/account" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/favorites" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/bookings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      
      <main className={`flex-1 ${isMobile ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Footer - hidden on mobile */}
      <footer className={`border-t mt-auto bg-gray-50 ${isMobile ? 'hidden' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Mounasabet</h3>
              <p className="text-sm text-gray-600">
                Your unified event booking platform for discovering and booking amazing event services.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/categories/venues" className="hover:text-gray-900">Venues</Link></li>
                <li><Link href="/categories/catering" className="hover:text-gray-900">Catering</Link></li>
                <li><Link href="/categories/photography" className="hover:text-gray-900">Photography</Link></li>
                <li><Link href="/categories/entertainment" className="hover:text-gray-900">Entertainment</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-gray-900">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Business</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/auth/signup?role=provider" className="hover:text-gray-900">Become a Provider</Link></li>
                <li><Link href="/business" className="hover:text-gray-900">Business Solutions</Link></li>
                <li><Link href="/partnerships" className="hover:text-gray-900">Partnerships</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © 2025 Mounasabet. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}