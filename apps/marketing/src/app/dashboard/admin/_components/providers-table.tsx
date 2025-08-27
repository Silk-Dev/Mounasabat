import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Provider {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  _count: {
    services: number;
  };
}

interface ProvidersTableProps {
  providers: Provider[];
  onUpdateStatus: (providerId: string, status: string) => void;
}

export function ProvidersTable({ providers, onUpdateStatus }: ProvidersTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PENDING':
        return 'outline';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'PENDING':
        return 'En attente';
      case 'SUSPENDED':
        return 'Suspendu';
      default:
        return status;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prestataire</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Inscrit le</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length > 0 ? (
            providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={provider.user.image || ''} alt={provider.user.name} />
                      <AvatarFallback>
                        {provider.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{provider.user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{provider.user.email}</TableCell>
                <TableCell>{provider._count.services}</TableCell>
                <TableCell>
                  {format(new Date(provider.createdAt), 'PP', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(provider.status)}>
                    {getStatusLabel(provider.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {provider.status !== 'ACTIVE' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(provider.id, 'ACTIVE')}
                        >
                          Activer
                        </DropdownMenuItem>
                      )}
                      {provider.status !== 'SUSPENDED' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(provider.id, 'SUSPENDED')}
                        >
                          Suspendre
                        </DropdownMenuItem>
                      )}
                      {provider.status !== 'PENDING' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(provider.id, 'PENDING')}
                        >
                          Mettre en attente
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Aucun prestataire trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
