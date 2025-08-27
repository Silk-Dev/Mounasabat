import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Settings, Bell, Users } from 'lucide-react';

export function DashboardNav() {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/dashboard/admin');
  const isProvider = pathname.startsWith('/dashboard/provider');

  const adminNavItems = [
    {
      href: '/dashboard/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/admin/providers',
      label: 'Prestataires',
      icon: Users,
    },
    {
      href: '/dashboard/admin/services',
      label: 'Services',
      icon: Package,
    },
    {
      href: '/dashboard/admin/settings',
      label: 'Paramètres',
      icon: Settings,
    },
  ];

  const providerNavItems = [
    {
      href: '/dashboard/provider',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/provider/services',
      label: 'Mes services',
      icon: Package,
    },
    {
      href: '/dashboard/provider/notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      href: '/dashboard/provider/settings',
      label: 'Paramètres',
      icon: Settings,
    },
  ];

  const navItems = isAdmin ? adminNavItems : providerNavItems;

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              isActive && 'bg-muted text-primary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
