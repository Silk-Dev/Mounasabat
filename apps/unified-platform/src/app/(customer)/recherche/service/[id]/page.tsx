'use client';

import { useParams } from 'next/navigation';
import ItemDetail from '@/components/ItemDetail';

const mockServices = [
  {
    id: '1',
    nom: 'Photographe professionnel',
    image: '/images/services/photographe.jpg',
    type: 'Photographie',
    note: 4.8,
    prix: '1 200',
    ville: 'Paris',
    description: 'Photographe professionnel spécialisé dans les mariages avec plus de 10 ans d\'expérience. Je capture les moments les plus précieux de votre grand jour avec un œil artistique et une attention particulière aux détails.',
    categories: ['Mariage', 'Événementiel'],
    disponible: true,
    galleryImages: [
      '/images/services/photographe-1.jpg',
      '/images/services/photographe-2.jpg',
      '/images/services/photographe-3.jpg'
    ],
    provider: {
      id: 'prov-001',
      nom: 'Sophie Martin',
      photo: '/images/providers/photographe-avatar.jpg',
      note: 4.9,
      avis: 127,
      ville: 'Paris',
      membreDepuis: '2018',
      description: 'Photographe passionnée par les histoires d\'amour et les moments authentiques. Je m\'efforce de capturer l\'émotion pure de chaque instant.',
      langues: ['Français', 'Anglais', 'Arabe']
    },
    prestations: [
      'Cérémonie complète (8h de couverture)',
      'Séance portrait en extérieur',
      'Album photo premium',
      'Photos numériques en haute résolution',
      'Retouches professionnelles'
    ],
    equipement: [
      'Appareil photo professionnel Canon EOS R5',
      'Objectifs haut de gamme 24-70mm f/2.8, 70-200mm f/2.8',
      'Flash professionnel et éclairage d\'appoint',
      'Matériel de secours complet'
    ]
  },
  {
    id: '12',
    nom: 'Traiteur gastronomique',
    image: '/images/services/traiteur.jpg',
    type: 'Traiteur',
    note: 4.9,
    prix: '3 500',
    ville: 'Lyon',
    description: 'Service traiteur haut de gamme spécialisé dans les mariages et événements d\'exception. Cuisine raffinée avec des produits frais et de saison.',
    categories: ['Mariage', 'Réception', 'Traiteur'],
    disponible: true,
    galleryImages: [
      '/images/services/traiteur-1.jpg',
      '/images/services/traiteur-2.jpg',
      '/images/services/traiteur-3.jpg'
    ],
    provider: {
      id: 'prov-012',
      nom: 'Épicure Événements',
      photo: '/images/providers/traiteur-avatar.jpg',
      note: 4.8,
      avis: 245,
      ville: 'Lyon',
      membreDepuis: '2015',
      description: 'Chef expérimenté spécialisé dans les événements d\'exception. Notre équipe s\'occupe de tout pour que vous puissiez profiter pleinement de votre événement.',
      langues: ['Français', 'Anglais', 'Italien']
    },
    prestations: [
      'Menu dégustation personnalisé',
      'Service en salle avec personnel qualifié',
      'Dressage des tables',
      'Vaisselle et couverts haut de gamme',
      'Service au vin et boissons'
    ],
    specialites: [
      'Cuisine française gastronomique',
      'Options végétariennes et végétaliennes',
      'Pâtisseries maison',
      'Service de découpe',
      'Buffet chaud et froid'
    ]
  },
];

export default function ServiceDetailPage() {
  const params = useParams();
  const service = mockServices.find(s => s.id === params.id);

  if (!service) {
    return <div>Service non trouvé</div>;
  }

  return <ItemDetail item={service} category="service" />;
}