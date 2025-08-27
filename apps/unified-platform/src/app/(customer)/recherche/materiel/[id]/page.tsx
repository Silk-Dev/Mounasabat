'use client';

import { useParams } from 'next/navigation';
import ItemDetail from '@/app/components/ItemDetail';

const mockMateriels = [
  {
    id: '1',
    nom: 'Tente de réception élégante',
    image: '/images/materiels/tente.jpg',
    type: 'Location de tente',
    note: 4.7,
    prix: '800',
    ville: 'Marseille',
    description: 'Tente de réception élégante pour 100 personnes. Inclut le montage, le démontage et la décoration de base. Parfaite pour les mariages et événements en extérieur.',
    categories: ['Mariage', 'Événement extérieur'],
    disponible: true,
    galleryImages: [
      '/images/materiels/tente-1.jpg',
      '/images/materiels/tente-2.jpg',
      '/images/materiels/tente-3.jpg'
    ],
    provider: {
      id: 'prov-003',
      nom: 'Événements Prestige',
      photo: '/images/providers/evenements-prestige.jpg',
      note: 4.8,
      avis: 156,
      ville: 'Marseille',
      membreDepuis: '2016',
      description: 'Spécialiste de la location de matériel événementiel haut de gamme. Nous mettons à votre disposition notre expertise et notre matériel pour faire de votre événement un moment inoubliable.',
      langues: ['Français', 'Anglais', 'Espagnol']
    },
    details: {
      capacite: 'Jusqu\'à 100 personnes',
      dimensions: '20m x 10m x 4m (L x l x H)',
      typeSol: 'Tous types de sols',
      eclairage: 'Inclus (LED)',
      chauffage: 'Optionnel (supplément)',
      sol: 'Revêtement intérieur inclus',
      montage: 'Inclus dans le prix',
      delaiReservation: '30 jours à l\'avance minimum'
    },
    options: [
      'Chauffage supplémentaire',
      'Décoration intérieure sur mesure',
      'Sol amovible',
      'Climatisation',
      'Éclairage personnalisé',
      'Montage express (24h)',
      'Assurance dommages',
      'Service de nettoyage'
    ],
    conditions: [
      'Caution de 1000€ requise',
      'Paiement de 30% à la réservation',
      'Annulation possible jusqu\'à 15 jours avant',
      'Montage la veille de l\'événement',
      'Démontage le lendemain',
      'Surface plane nécessaire',
      'Accès véhicule nécessaire',
      'Certification de sécurité en règle'
    ]
  },
];

export default function MaterielDetailPage() {
  const params = useParams();
  const materiel = mockMateriels.find(m => m.id === params.id);

  if (!materiel) {
    return <div>Matériel non trouvé</div>;
  }

  return <ItemDetail item={materiel} category="materiel" />;
}
