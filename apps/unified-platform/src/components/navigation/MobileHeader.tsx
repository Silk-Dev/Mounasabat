'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { NotificationBell } from '@/components/notifications';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileHeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  title?: string;
  showBack?: boolean;
  onBackClick?: () => void;
}

export function MobileHeader({ 
  showSearch = true, 
  onSearchClick,
  title,
  showBack = false,
  onBackClick
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { session, signOut, isLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      router.push('/search');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="touch-friendly mr-2"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="touch-friendly"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="text-2xl font-bold text-primary">
                      Mounasabet
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-8 space-y-4">
                  {session ? (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={session.user.image} alt={session.user.name} />
                        <AvatarFallback>
                          {session.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link href="/auth/signin">Sign In</Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/auth/signup">Sign Up</Link>
                      </Button>
                    </div>
                  )}

                  <nav className="space-y-2">
                    <Link
                      href="/"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/search"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Search Services
                    </Link>
                    <Link
                      href="/categories"
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Categories
                    </Link>
                    
                    {session && (
                      <>
                        <Link
                          href="/favorites"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Favorites
                        </Link>
                        <Link
                          href="/bookings"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/notifications"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Notifications
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile Settings
                        </Link>
                      </>
                    )}
                  </nav>

                  {session && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900 ml-2">{title}</h1>
          ) : (
            <Link href="/" className="text-xl font-bold text-primary ml-2">
              Mounasabet
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchClick}
              className="touch-friendly"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {session && (
            <NotificationBell />
          )}
          
          {!session && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="touch-friendly"
            >
              <Link href="/auth/signin">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}