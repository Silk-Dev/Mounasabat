"use client";
import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

interface Materiel {
  id: string;
  nom: string;
  type: string;
  note: number;
  prix: string;
  image: string;
  description: string;
  evenement: string;
  ville: string;
  disponible: boolean;
}

type ReviewCounts = Record<string, number>;

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function CarteMateriel({ m, reviewCounts }: { m: Materiel; reviewCounts: ReviewCounts }) {
  return (
    <div className="group">
      <Link href={`/recherche/materiel/${m.id}`}>
        {/* Image container with heart icon */}
        <div className="relative mb-2">
          <div className="aspect-square overflow-hidden rounded-2xl relative w-full min-h-[165px]">
            <Image
              src={m.image}
              alt={m.nom}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-2xl"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          </div>
          <button 
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              // Handle save to favorites
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {!m.disponible && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-2xl">
              <span className="text-white font-medium bg-red-500 px-3 py-1 rounded-full text-sm">Indisponible</span>
            </div>
          )}
        </div>
        
        {/* Material details */}
        <div className="space-y-1">
          <h3 className="font-medium text-gray-900 line-clamp-1">{m.nom}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <StarRating rating={m.note} />
              <span className="text-xs text-gray-500 ml-1">({reviewCounts[m.id] || 0})</span>
            </div>
            <span className="text-xs text-gray-500">{m.ville}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">{m.prix} TND</span>
            <span className="text-xs text-gray-500">/jour</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

const mockMateriels: Materiel[] = [
  {
    id: "mat-1",
    nom: "Tente de réception ",
    type: "Tente/Chapiteau",
    note: 4.8,
    prix: "1 200",
    image: "/event-decor.jpg",
    description: "Tente élégante pour réception de mariage avec structure blanche et décorations raffinées. Parfaite pour des événements en extérieur.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-2",
    nom: "Chaises de cérémonie blanches",
    type: "Mobilier",
    note: 4.7,
    prix: "500",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    description: "Chaises de cérémonie élégantes en blanc pour un mariage de rêve.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-3",
    nom: "Éclairage d'ambiance romantique",
    type: "Éclairage",
    note: 4.5,
    prix: "850",
    image: "/event-decor.jpg",
    description: "Éclairage d'ambiance pour créer une atmosphère romantique et chaleureuse.",
    evenement: "Mariage",
    ville: "Sousse",
    disponible: true
  },
  {
    id: "mat-4",
    nom: "Mobilier de réception",
    type: "Mobilier",
    note: 4.6,
    prix: "2 000",
    image: "/Salon Élégance.jpg",
    description: "Ensemble de mobilier élégant pour vos réceptions et événements.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-5",
    nom: "Bar mobile",
    type: "Restauration",
    note: 4.9,
    prix: "1 800",
    image: "/Délices & Gourmandises.jpg",
    description: "Bar mobile élégant pour servir vos invités avec style lors de votre réception.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-6",
    nom: "Décoration florale",
    type: "Décoration",
    note: 4.8,
    prix: "1 100",
    image: "/floral decorations .jpg",
    description: "Magnifiques compositions florales pour embellir votre événement.",
    evenement: "Mariage",
    ville: "Hammamet",
    disponible: true
  },
  {
    id: "mat-7",
    nom: "Photobooth moderne",
    type: "Animation",
    note: 4.9,
    prix: "950",
    image: "/Smile Box.jpg",
    description: "Photobooth moderne avec accessoires pour des souvenirs mémorables.",
    evenement: "Anniversaire",
    ville: "Sousse",
    disponible: true
  },
  {
    id: "mat-8",
    nom: "Voiture de prestige",
    type: "Transport",
    note: 5.0,
    prix: "2 500",
    image: "/Prestige Cars.jpg",
    description: "Voiture de luxe pour le grand jour ou les événements spéciaux.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-9",
    nom: "Structure de danse",
    type: "Mobilier",
    note: 4.7,
    prix: "1 300",
    image: "/event equipment.jpg",
    description: "Piste de danse surélevée pour mettre en valeur vos premiers pas.",
    evenement: "Mariage",
    ville: "Nabeul",
    disponible: true
  },
  {
    id: "mat-10",
    nom: "Écran géant LED",
    type: "Audiovisuel",
    note: 4.8,
    prix: "2 200",
    image: "/Motion Story.jpg",
    description: "Écran LED haute définition pour diffuser vos vidéos et animations.",
    evenement: "Conférence",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-11",
    nom: "Jeux d'extérieur",
    type: "Animation",
    note: 4.5,
    prix: "750",
    image: "/Anniversaire festif.jpg",
    description: "Ensemble de jeux pour animer vos événements en plein air.",
    evenement: "Anniversaire",
    ville: "Bizerte",
    disponible: true
  },
  {
    id: "mat-12",
    nom: "Tente de réception de luxe",
    type: "Tente/Chapiteau",
    note: 4.9,
    prix: "2 800",
    image: "/Tente de réception.jpg",
    description: "Tente de réception de luxe pour vos événements les plus prestigieux.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-13",
    nom: "Éclairage de scène",
    type: "Éclairage",
    note: 4.8,
    prix: "1 200",
    image: "/Éclairage de scène.jpg",
    description: "Éclairage de scène professionnel pour vos concerts et spectacles.",
    evenement: "Concert",
    ville: "Sfax",
    disponible: true
  },
  {
    id: "mat-14",
    nom: "Mobilier de salon",
    type: "Mobilier",
    note: 4.7,
    prix: "1 800",
    image: "/Salon Élégance.jpg",
    description: "Ensemble de mobilier de salon élégant pour vos réceptions et événements.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-15",
    nom: "Bar à cocktails",
    type: "Restauration",
    note: 4.9,
    prix: "2 000",
    image: "/Bar à cocktails.jpg",
    description: "Bar à cocktails élégant pour servir vos invités avec style lors de votre réception.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-16",
    nom: "Décoration de table",
    type: "Décoration",
    note: 4.8,
    prix: "900",
    image: "/Décoration de table.jpg",
    description: "Magnifiques décorations de table pour embellir votre événement.",
    evenement: "Mariage",
    ville: "Hammamet",
    disponible: true
  },
  {
    id: "mat-17",
    nom: "Photobooth vintage",
    type: "Animation",
    note: 4.9,
    prix: "1 100",
    image: "/Photobooth vintage.jpg",
    description: "Photobooth vintage avec accessoires pour des souvenirs mémorables.",
    evenement: "Anniversaire",
    ville: "Sousse",
    disponible: true
  }
];

export default function MaterielPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reviewCounts, setReviewCounts] = useState<ReviewCounts>({});
  const [evenement, setEvenement] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement de données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Générer les compteurs d'avis côté client uniquement
    const counts: Record<string, number> = {};
    mockMateriels.forEach(materiel => {
      counts[materiel.id] = Math.floor(Math.random() * 50) + 5;
    });
    setReviewCounts(counts);

    return () => clearTimeout(timer);
  }, []);

  const filteredCategories = Array.from(new Set(mockMateriels.map((m: Materiel) => m.type)));

  const filteredMateriels = mockMateriels.filter((m: Materiel) => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    // Si pas de recherche et pas de catégorie sélectionnée, tout afficher
    if (searchLower === '' && !selectedCategory && !evenement) return true;
    
    // Vérifier la correspondance avec la recherche (nom ou type)
    const matchesSearch = searchLower === '' || 
      m.nom.toLowerCase().includes(searchLower) ||
      m.type.toLowerCase().includes(searchLower);
    
    // Vérifier la correspondance avec la catégorie
    const matchesCategory = !selectedCategory || 
      m.type === selectedCategory;
    
    // Vérifier la correspondance avec l'événement
    const matchesEvent = !evenement || 
      m.evenement === evenement;
    
    return matchesSearch && matchesCategory && matchesEvent;
  });

  const resetFilters = (): void => {
    setSearchQuery("");
    setSelectedCategory(null);
    setEvenement("");
  };

  const handleCategorySelect = (category: string): void => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleEvenementChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setEvenement(e.target.value);
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    // La recherche est déjà gérée par le filtre
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F16462]"></div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="min-h-screen bg-white">
        <main className="w-full px-10">
          {/* Add margin to push content down */}
          <div className="h-24"></div>
          <div className="w-full space-y-6">
            {/* Barre de recherche */}
            <div className="relative mt-12">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#3A3A3A]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un matériel ou une catégorie..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent text-[#3A3A3A] placeholder-[#9CA3AF] text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filtres rapides */}
            <div className="overflow-x-auto pb-3 -mx-2">
              <div className="flex space-x-2 px-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === null 
                      ? 'bg-[#F16462] text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {Array.from(new Set(mockMateriels.map(m => m.type))).map((type, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleCategorySelect(type)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      type === selectedCategory 
                        ? 'bg-[#F16462] text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>


            {/* Résultats */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory || evenement ? (
                    <>
                      Matériel {selectedCategory ? `de type ${selectedCategory}` : ''} 
                      {selectedCategory && evenement ? ' pour ' : ''}
                      {evenement ? `${evenement}s` : ''}
                      <span className="text-gray-500 text-lg font-normal ml-2">
                        ({filteredMateriels.length} résultat{filteredMateriels.length > 1 ? 's' : ''})
                      </span>
                    </>
                  ) : 'Tous les matériels disponibles'}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Trier par :</span>
                  <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option>Pertinence</option>
                    <option>Prix croissant</option>
                    <option>Prix décroissant</option>
                    <option>Meilleures notes</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      setEvenement('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F16462] hover:bg-[#e04e4c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F16462]"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* First row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
                {filteredMateriels.slice(0, 7).map((materiel) => (
                  <CarteMateriel 
                    key={materiel.id} 
                    m={materiel} 
                    reviewCounts={reviewCounts} 
                  />
                ))}
              </div>
              
              {/* Second row */}
              {filteredMateriels.length > 7 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
                  {filteredMateriels.slice(7, 14).map((materiel) => (
                    <CarteMateriel 
                      key={materiel.id} 
                      m={materiel} 
                      reviewCounts={reviewCounts} 
                    />
                  ))}
                </div>
              )}
              
              {/* Third row */}
              {filteredMateriels.length > 14 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
                  {filteredMateriels.slice(14, 21).map((materiel) => (
                    <CarteMateriel 
                      key={materiel.id} 
                      m={materiel} 
                      reviewCounts={reviewCounts} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
};
