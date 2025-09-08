'use client';

import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from "@/components/Header";
import Footer from "@/components/Footer";


export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className={`flex-1 ${isMobile ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {/* Mobile Navigation */}
      <MobileNavigation />

      <Footer />
    </div>
  );
}