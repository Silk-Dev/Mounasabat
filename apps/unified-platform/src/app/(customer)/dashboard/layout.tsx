'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
      return;
    }

    if (!isLoading && session?.user) {
      // Redirect based on user role
      if (session.user.role === 'admin' && !pathname.startsWith('/dashboard/admin')) {
        router.push('/dashboard/admin');
      } else if (session.user.role === 'provider' && !pathname.startsWith('/dashboard/provider')) {
        router.push('/dashboard/provider');
      } else if (session.user.role === 'customer') {
        // Redirect regular users to their profile or home
        router.push('/profile');
      }
    }
  }, [isLoading, session, router, pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
