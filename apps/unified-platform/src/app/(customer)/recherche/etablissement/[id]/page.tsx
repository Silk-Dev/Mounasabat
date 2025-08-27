'use client';

import { useParams } from 'next/navigation';
import ItemDetail from '@/app/components/ItemDetail';

const mockEtablissements = [
  {
    id: '1',
    nom: 'Château de la Vallée',
    image: '/images/etablissements/chateau.jpg',
    type: 'Salle de réception',
    note: 4.9,
    prix: '5 000',
    ville: 'Lyon',
    description: 'Magnifique château du 18ème siècle entouré d\'un parc de 10 hectares. Parfait pour les mariages et événements d\'exception. Capacité d\'accueil jusqu\'à 300 personnes.',
    categories: ['Mariage', 'Réception', 'Séminaire'],
    disponible: true,
    galleryImages: [
      '/images/etablissements/chateau-1.jpg',
      '/images/etablissements/chateau-2.jpg',
      '/images/etablissements/chateau-3.jpg'
    ],
    provider: {
      id: 'prov-002',
      nom: 'Pierre Dubois',
      photo: '/images/providers/chateau-owner.jpg',
      note: 4.8,
      avis: 89,
      ville: 'Lyon',
      membreDepuis: '2017',
      description: 'Passionné par l\'histoire et l\'architecture, je mets à votre disposition ce lieu chargé d\'histoire pour vos événements les plus importants.',
      langues: ['Français', 'Anglais']
    },
    capacite: 300,
    chambres: 15,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true,
    caracteristiques: [
      'Parc de 10 hectares',
      'Salle de réception de 400m²',
      'Terrasse panoramique',
      'Cuisine professionnelle',
      'Parking privé sécurisé',
      '15 chambres d\'hôtes',
      'Piscine chauffée',
      'Jardin à la française'
    ],
    options: [
      'Location de mobilier',
      'Service traiteur sur demande',
      'Décoration florale',
      'Animation musicale',
      'Hébergement sur place',
      'Service de sécurité',
      'Stationnement privé',
      'Accès handicapé'
    ]
  },
];

export default function EtablissementDetailPage() {
  const params = useParams();
  const etablissement = mockEtablissements.find(e => e.id === params.id);

  if (!etablissement) {
    return <div>Établissement non trouvé</div>;
  }

  return <ItemDetail item={etablissement} category="etablissement" />;
}
