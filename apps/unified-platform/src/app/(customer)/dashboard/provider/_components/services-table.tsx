import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Service } from '../page';

interface ServicesTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export function ProviderServicesTable({ services, onEdit, onDelete }: ServicesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approuvé</Badge>;
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length > 0 ? (
            services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {service.images?.[0] && (
                      <div className="h-10 w-10 rounded-md overflow-hidden">
                        <img
                          src={service.images[0]}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <span>{service.title}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{service.category.toLowerCase()}</TableCell>
                <TableCell>
                  {service.price ? `${service.price.toFixed(2)} €` : 'Sur devis'}
                </TableCell>
                <TableCell>{getStatusBadge(service.status)}</TableCell>
                <TableCell>
                  {format(new Date(service.createdAt), 'PP', { locale: fr })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(service)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service.id)}
                      disabled={deletingId === service.id}
                      title="Supprimer"
                    >
                      {deletingId === service.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Aucun service trouvé. Commencez par en ajouter un.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
