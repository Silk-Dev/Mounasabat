"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/app/components/Header";
import { StarIcon } from "@heroicons/react/24/solid";

type ReviewCounts = Record<string, number>;

interface Etablissement {
  id: string;
  nom: string;
  image: string;
  categorie: string;
  type: string;
  ville: string;
  note: number;
  prix: string;
  description: string;
  evenement: string;
  disponible: boolean;
  capacite: number;
  chambres?: number;
  parking?: boolean;
  climatisation?: boolean;
  terrasse?: boolean;
  piscine?: boolean;
}

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

interface CarteEtablissementProps {
  e: Etablissement;
  reviewCounts: ReviewCounts;
}

function CarteEtablissement({ e, reviewCounts }: CarteEtablissementProps) {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#F16462]/30">
      <Link href={`/etablissement/${e.id}`} className="block h-full">
        
        {/* Image de l'établissement */}
        <div className="relative pb-[75%] bg-gray-50 overflow-hidden">
          <div className="absolute inset-0">
            <Image 
              src={e.image} 
              alt={e.nom}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
            {/* Overlay de dégradé */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          {/* Badge de catégorie */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
              {e.type}
            </span>
          </div>
        </div>
        
        {/* Détails de l'établissement */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{e.nom}</h3>
          
          <p className="text-sm text-gray-500 mt-1">
            {e.ville} • {e.capacite} pers. max
          </p>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">À partir de</span>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-gray-900">{e.prix}</span>
                  <span className="ml-1 text-sm text-gray-500">TND</span>
                  <span className="text-xs text-gray-400 ml-1">/soirée</span>
                </div>
              </div>
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-[#F16462] hover:bg-[#e04e4c]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                Réserver
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

const mockEtablissements: Etablissement[] = [
  {
    id: "etab-1",
    nom: "Palais des Noces",
    categorie: "Salle de réception",
    type: "Salle de réception",
    ville: "Tunis",
    note: 4.8,
    prix: "3 500",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    description: "Salle de réception élégante et spacieuse pour mariages de rêve. Capacité jusqu'à 500 personnes.",
    evenement: "Mariage",
    disponible: true,
    capacite: 500,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-2",
    nom: "Villa Les Oliviers",
    categorie: "Villa d'exception",
    type: "Villa",
    ville: "Sousse",
    note: 4.9,
    prix: "4 200",
    image: "/Salon Élégance.jpg",
    description: "Villa de luxe avec vue imprenable sur la mer. Idéale pour des événements intimes et prestigieux.",
    evenement: "Mariage",
    disponible: true,
    capacite: 120,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true,
    chambres: 8
  },
  {
    id: "etab-3",
    nom: "Domaine des Cèdres",
    categorie: "Domaine événementiel",
    type: "Domaine",
    ville: "Bizerte",
    note: 4.7,
    prix: "5 800",
    image: "/Palais des Fêtes.jpg",
    description: "Domaine de charme niché dans un écrin de verdure, parfait pour des mariages romantiques.",
    evenement: "Mariage",
    disponible: true,
    capacite: 300,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-4",
    nom: "Résidence El Andalous",
    categorie: "Résidence d'événements",
    type: "Résidence",
    ville: "Hammamet",
    note: 4.6,
    prix: "3 200",
    image: "/Mariage élégant.jpg",
    description: "Résidence de prestige au style andalou pour des réceptions raffinées et élégantes.",
    evenement: "Mariage",
    disponible: true,
    capacite: 250,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-5",
    nom: "Le Jardin Secret",
    categorie: "Jardin d'événements",
    type: "Jardin",
    ville: "La Marsa",
    note: 4.9,
    prix: "4 500",
    image: "/Le Jardin Secret.jpg",
    description: "Écrin de verdure en plein cœur de la ville pour des célébrations en plein air inoubliables.",
    evenement: "Mariage",
    disponible: false,
    capacite: 400,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-6",
    nom: "Le Riad des Princes",
    categorie: "Riad d'exception",
    type: "Riad",
    ville: "Sidi Bou Saïd",
    note: 4.8,
    prix: "3 800",
    image: "/Rêve de Mariée.jpg",
    description: "Riad de charme au style arabo-andalou pour des réceptions intimes et raffinées.",
    evenement: "Mariage",
    disponible: true,
    capacite: 150,
    parking: false,
    climatisation: true,
    terrasse: true,
    piscine: true,
    chambres: 6
  },
  {
    id: "etab-7",
    nom: "Les Voûtes de Carthage",
    categorie: "Salle historique",
    type: "Salle",
    ville: "Carthage",
    note: 4.7,
    prix: "5 200",
    image: "/Ambiance élégant.jpg",
    description: "Lieu chargé d'histoire pour des mariages au charme intemporel et élégant.",
    evenement: "Mariage",
    disponible: true,
    capacite: 350,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-8",
    nom: "Le Phare de Sidi Bou",
    categorie: "Salle avec vue mer",
    type: "Salle",
    ville: "Sidi Bou Saïd",
    note: 4.9,
    prix: "6 500",
    image: "/Ambiance moderne.jpg",
    description: "Lieu d'exception avec vue panoramique sur la mer pour des événements mémorables.",
    evenement: "Mariage",
    disponible: true,
    capacite: 200,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  }
];

export default function EtablissementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVille, setSelectedVille] = useState<string | null>(null);
  const [evenement, setEvenement] = useState("Mariage");
  const [reviewCounts, setReviewCounts] = useState<ReviewCounts>({});
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState<string>("pertinence");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const handlePriceRangeChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setPriceRange([min, max]);
  };

  const resetFilters = (): void => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedVille(null); 
    setEvenement("Mariage"); // Reset to default
    setPriceRange([0, 10000]); // Reset price range
    setRating(null); // Reset rating
    setMinPrice(0); // Reset min price
    setMaxPrice(10000); // Reset max price
    setSelectedSort("pertinence");
  };

  // Filtrer les établissements en fonction des critères de recherche
  const filteredEtablissements = mockEtablissements.filter((etab) => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === '' ||
      etab.nom.toLowerCase().includes(searchLower) ||
      etab.ville.toLowerCase().includes(searchLower) ||
      etab.type.toLowerCase().includes(searchLower);
    
    const matchesCategory = !selectedCategory || etab.type === selectedCategory;
    const matchesVille = !selectedVille || etab.ville === selectedVille;
    const matchesEvenement = !evenement || etab.evenement === evenement;
    
    const price = parseInt(etab.prix.replace(/\D/g, ''));
    const matchesPrice = price >= minPrice && price <= maxPrice;
    
    return matchesSearch && matchesCategory && matchesVille && matchesEvenement && matchesPrice;
  });

  // Trier les établissements
  const sortedEtablissements = [...filteredEtablissements].sort((a, b) => {
    const priceA = parseInt(a.prix.replace(/\D/g, ''));
    const priceB = parseInt(b.prix.replace(/\D/g, ''));
    
    switch (selectedSort) {
      case 'prix-croissant':
        return priceA - priceB;
      case 'prix-decroissant':
        return priceB - priceA;
      case 'meilleures-notes':
        return b.note - a.note;
      default: // pertinence
        return 0; // Pour l'instant, pas de tri de pertinence spécifique
    }
  });

  useEffect(() => {
    // Simulate data loading
    setIsLoading(true);
    const counts: Record<string, number> = {};
    mockEtablissements.forEach(etab => {
      counts[etab.id] = Math.floor(Math.random() * 50) + 5;
    });
    setReviewCounts(counts);
    setIsLoading(false);
  }, []);

  // Add loading state check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F16462]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="w-full py-6 mt-4 px-10">
        <div className="w-full text-[#333333]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#333333]">Tous les établissements</h2>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 text-base rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:bg-white focus:shadow-sm placeholder-gray-500"
                placeholder="Rechercher un établissement ou une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-[#333333]">Catégories</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  !selectedCategory ? 'bg-[#F16462] text-white' : 'bg-gray-100 text-[#333333] hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Tous
              </button>
              {['Salle de réception', 'Villa', 'Domaine', 'Riad', 'Jardin'].map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category ? 'bg-[#F16462] text-white' : 'bg-gray-100 text-[#333333] hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          <div>
            {/* Etablissements Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {sortedEtablissements.map((etab) => (
                <CarteEtablissement
                  key={etab.id}
                  e={etab}
                  reviewCounts={reviewCounts}
                />
              ))}
            </div>

            {/* Empty State */}
            {sortedEtablissements.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">Aucun établissement trouvé</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-[#F16462] text-white rounded-md hover:bg-[#e04e4c]"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};