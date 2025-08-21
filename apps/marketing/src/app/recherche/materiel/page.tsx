"use client";
import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/app/components/Header";

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
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#F16462]/30">
      <Link href={`/materiel/${m.id}`} className="block">
        <div className="relative pb-[100%] bg-gray-50">
          <Image 
            src={m.image} 
            alt={m.nom}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            priority={false}
            loading="lazy"
          />
          {!m.disponible && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium bg-red-500 px-3 py-1 rounded-full text-sm">Indisponible</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{m.nom}</h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <StarRating rating={m.note} />
              <span className="text-xs text-gray-500 ml-1">({reviewCounts[m.id] || 0} avis)</span>
            </div>
            <span className="text-xs text-gray-500">{m.ville}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
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
    nom: "Tente de réception élégante",
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
    note: 4.9,
    prix: "850",
    image: "/Lumière d'Été.jpg",
    description: "Éclairage chaleureux pour créer une atmosphère intime et romantique.",
    evenement: "Mariage",
    ville: "Sousse",
    disponible: true
  },
  {
    id: "mat-4",
    nom: "Décoration florale de table",
    type: "Décoration",
    note: 4.8,
    prix: "450",
    image: "/Fleurs d'Exception.jpg",
    description: "Centres de table élégants avec compositions florales fraîches et raffinées.",
    evenement: "Mariage",
    ville: "Hammamet",
    disponible: true
  },
  {
    id: "mat-5",
    nom: "Piste de danse éclairée",
    type: "Animation",
    note: 4.9,
    prix: "1 200",
    image: "/Show Time.jpg",
    description: "Piste de danse LED personnalisable pour illuminer votre soirée de mariage.",
    evenement: "Mariage",
    ville: "Tunis",
    disponible: true
  },
  {
    id: "mat-6",
    nom: "Photobooth avec accessoires",
    type: "Animation",
    note: 4.8,
    prix: "950",
    image: "/Studio Photo Créatif.jpg",
    description: "Photobooth amusant avec accessoires pour des souvenirs mémorables.",
    evenement: "Mariage",
    ville: "Sousse",
    disponible: true
  },
  {
    id: "mat-7",
    nom: "Mobilier de salon élégant",
    type: "Mobilier",
    note: 4.7,
    prix: "1 500",
    image: "/Salon Élégance.jpg",
    description: "Ensemble de salon élégant pour votre espace détente lors de la réception.",
    evenement: "Mariage",
    ville: "Hammamet",
    disponible: true
  },
  {
    id: "mat-8",
    nom: "Bar mobile élégant",
    type: "Restauration",
    note: 4.9,
    prix: "1 800",
    image: "/Délices & Gourmandises.jpg",
    description: "Bar mobile élégant pour servir vos invités avec style lors de votre réception.",
    evenement: "Mariage",
    ville: "Tunis",
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
        <Header />
        <main className="w-full py-6 px-10">
          <div className="w-full space-y-6">
            {/* Barre de recherche */}
            <div className="relative">
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#3A3A3A]">Trier par :</span>
                  <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#F16462] focus:border-transparent text-[#3A3A3A] bg-white">
                    <option>Pertinence</option>
                    <option>Prix croissant</option>
                    <option>Prix décroissant</option>
                    <option>Meilleures notes</option>
                  </select>
                </div>
              </div>
              
              {filteredMateriels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                  {filteredMateriels.map((materiel: Materiel) => (
                    <CarteMateriel 
                      key={materiel.id} 
                      m={materiel}
                      reviewCounts={reviewCounts}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun matériel trouvé</h3>
                  <p className="mt-1 text-gray-500">Essayez de modifier vos critères de recherche.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                        setEvenement('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F16462] hover:bg-[#e04e4c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F16462]"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
};
