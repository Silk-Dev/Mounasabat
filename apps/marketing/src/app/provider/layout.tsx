import { authOptions } from '@/lib/auth-options';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { ProviderSidebar } from '@/components/provider/ProviderSidebar';

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/provider/login');
  }

  if (session.user.role !== 'PROVIDER') {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ProviderSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
