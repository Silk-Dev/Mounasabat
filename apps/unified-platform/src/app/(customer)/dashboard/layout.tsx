'use client';

import { authClient } from '@/lib/auth/client';
import { createAuthClient } from 'better-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { useSession } = createAuthClient();

  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) {
      // Show loading state
      return;
    }
    if (!session || !session.user) {
      router.push('/login');
      return;
    }
    

    if (session?.user) {
      // Redirect based on user role
      if (session.user.role === 'ADMIN' && !pathname.startsWith('/dashboard/admin')) {
        router.push('/dashboard/admin');
      } else if (session.user.role === 'PROVIDER' && !pathname.startsWith('/dashboard/provider')) {
        router.push('/dashboard/provider');
      } else if (session.user.role === 'USER') {
        // Redirect regular users to their profile or home
        router.push('/profile');
      }
    }
  }, [status, session, router, pathname]);

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
