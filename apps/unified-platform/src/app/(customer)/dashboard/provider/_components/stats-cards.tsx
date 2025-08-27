import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalServices: number;
    activeServices: number;
    pendingServices: number;
    rejectedServices: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total des services',
      value: stats.totalServices,
      icon: TrendingUp,
      description: 'Tous vos services',
    },
    {
      title: 'Services actifs',
      value: stats.activeServices,
      icon: CheckCircle,
      description: 'Services approuvés',
      variant: 'success' as const,
    },
    {
      title: 'En attente',
      value: stats.pendingServices,
      icon: Clock,
      description: 'En attente de validation',
      variant: 'warning' as const,
    },
    {
      title: 'Rejetés',
      value: stats.rejectedServices,
      icon: XCircle,
      description: 'Services non approuvés',
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon
              className={`h-4 w-4 ${
                card.variant === 'success'
                  ? 'text-green-600'
                  : card.variant === 'warning'
                  ? 'text-yellow-500'
                  : card.variant === 'destructive'
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-3 w-[70%]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
