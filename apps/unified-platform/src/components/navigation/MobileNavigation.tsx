'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@mounasabet/ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/search',
    label: 'Search',
    icon: Search,
  },
  {
    href: '/favorites',
    label: 'Favorites',
    icon: Heart,
    requiresAuth: true,
  },
  {
    href: '/bookings',
    label: 'Bookings',
    icon: Calendar,
    requiresAuth: true,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { session } = useAuth();

  // Don't show mobile nav on auth pages or admin/provider pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/provider')) {
    return null;
  }

  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && session)
  );

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : 'text-gray-500'}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-1" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}