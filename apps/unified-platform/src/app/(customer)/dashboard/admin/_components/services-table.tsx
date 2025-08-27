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
import { MoreHorizontal, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  price: number | null;
  images: string[];
  createdAt: string;
  provider: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface ServicesTableProps {
  services: Service[];
  onUpdateStatus: (serviceId: string, status: string, rejectionReason?: string) => void;
}

export function ServicesTable({ services, onUpdateStatus }: ServicesTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'outline';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approuvé';
      case 'PENDING':
        return 'En attente';
      case 'REJECTED':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const handleRejectWithReason = (serviceId: string) => {
    const reason = prompt('Veuillez indiquer la raison du rejet :');
    if (reason) {
      onUpdateStatus(serviceId, 'REJECTED', reason);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Prestataire</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length > 0 ? (
            services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    {service.images && service.images.length > 0 ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden">
                        <img
                          src={service.images[0]}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {service.title.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{service.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {service.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {service.category.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {service.price ? `${service.price} €` : 'Sur devis'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {service.provider.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{service.provider.user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(service.createdAt), 'PP', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(service.status)}>
                    {getStatusLabel(service.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      onClick={() => onUpdateStatus(service.id, 'APPROVED')}
                      title="Approuver"
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Approuver</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleRejectWithReason(service.id)}
                      title="Rejeter"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Rejeter</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(service.id, 'APPROVED')}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approuver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRejectWithReason(service.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Aucun service trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
