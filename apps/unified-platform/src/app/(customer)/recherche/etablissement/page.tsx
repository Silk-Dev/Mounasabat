"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
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
    <div className="group cursor-pointer">
      <Link href={`/recherche/etablissement/${e.id}`}>
        {/* Image container with heart icon */}
        <div className="relative mb-2">
          <div className="aspect-square overflow-hidden rounded-2xl relative w-full min-h-[165px]">
            <Image
              src={e.image}
              alt={e.nom}
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
        {/* Property details */}
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900 text-[15px] truncate">{e.nom}</h3>
            <div className="flex items-center">
              <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm ml-0.5">{e.note.toFixed(1)}</span>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm">{e.ville}</p>
          <p className="text-gray-500 text-sm">
            {e.capacite} personnes • {e.type}
          </p>
          
          <div className="flex items-center pt-1">
            <span className="font-semibold">{parseInt(e.prix).toLocaleString('fr-TN')} TND</span>
            <span className="text-gray-500 text-sm ml-1">soirée</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

const mockEtablissements: Etablissement[] = [
  // Ligne 1
  {
    id: "etab-1",
    nom: "Le Jardin Secret",
    image: "/Le Jardin Secret.jpg",
    categorie: "Jardin",
    type: "Salle de réception",
    ville: "Tunis",
    note: 4.8,
    prix: "5000",
    description: "Un cadre enchanteur pour votre réception de mariage au cœur de Tunis",
    evenement: "Mariage",
    disponible: true,
    capacite: 200,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-2",
    nom: "Palais des Fêtes",
    image: "/Palais des Fêtes.jpg",
    categorie: "Salle de réception",
    type: "Salle de réception",
    ville: "Sfax",
    note: 4.7,
    prix: "6500",
    description: "Un palais somptueux pour des réceptions grandioses à Sfax",
    evenement: "Mariage",
    disponible: true,
    capacite: 400,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-3",
    nom: "Villa Sidi Bou",
    image: "/lieu de mariage.jpg",
    categorie: "Villa",
    type: "Villa d'exception",
    ville: "Sidi Bou Saïd",
    note: 4.9,
    prix: "8500",
    description: "Villa de charme avec vue imprenable sur la Méditerranée",
    evenement: "Mariage",
    disponible: true,
    capacite: 120,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-4",
    nom: "Domaine Carthage",
    image: "/event-decor.jpg",
    categorie: "Domaine",
    type: "Domaine privé",
    ville: "Carthage",
    note: 4.8,
    prix: "9500",
    description: "Domaine historique avec vue sur les ruines de Carthage",
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
    nom: "Riad L'Étoile",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Riad",
    type: "Riad d'exception",
    ville: "Sousse",
    note: 4.9,
    prix: "3800",
    description: "Riad intimiste au cœur de la médina de Sousse",
    evenement: "Mariage",
    disponible: true,
    capacite: 80,
    parking: false,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-6",
    nom: "Les Jardins de la Médina",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Jardin",
    type: "Jardin d'exception",
    ville: "Monastir",
    note: 4.6,
    prix: "2900",
    description: "Écrin de verdure en plein cœur de la médina de Monastir",
    evenement: "Mariage",
    disponible: true,
    capacite: 250,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-7",
    nom: "Le Palais Royal",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Palais",
    type: "Palais d'exception",
    ville: "Hammamet",
    note: 5.0,
    prix: "7500",
    description: "Ancien palais rénové avec élégance à Hammamet",
    evenement: "Mariage",
    disponible: true,
    capacite: 400,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  // Ligne 2
  {
    id: "etab-8",
    nom: "La Villa des Oliviers",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Villa",
    type: "Villa de luxe",
    ville: "Djerba",
    note: 4.7,
    prix: "4200",
    description: "Villa moderne avec vue sur la mer à Djerba",
    evenement: "Mariage",
    disponible: true,
    capacite: 120,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-9",
    nom: "Le Riad des Sens",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Riad",
    type: "Riad d'exception",
    ville: "Kairouan",
    note: 4.8,
    prix: "4100",
    description: "Riad de charme aux couleurs de la Tunisie",
    evenement: "Mariage",
    disponible: true,
    capacite: 100,
    parking: false,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-10",
    nom: "Les Jardins de la Côte",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Jardin",
    type: "Jardin botanique",
    ville: "Nabeul",
    note: 4.5,
    prix: "3700",
    description: "Jardin luxuriant face à la mer à Nabeul",
    evenement: "Mariage",
    disponible: true,
    capacite: 180,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-11",
    nom: "Le Domaine des Oliviers",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Domaine",
    type: "Domaine agricole",
    ville: "Zaghouan",
    note: 4.9,
    prix: "5200",
    description: "Domaine entouré d'oliviers centenaires à Zaghouan",
    evenement: "Mariage",
    disponible: true,
    capacite: 350,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-12",
    nom: "La Kasbah des Oiseaux",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Riad",
    type: "Riad d'exception",
    ville: "Tozeur",
    note: 4.7,
    prix: "4800",
    description: "Ancienne kasbah restaurée avec élégance à Tozeur",
    evenement: "Mariage",
    disponible: true,
    capacite: 200,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-13",
    nom: "Les Jardins de la Palmeraie",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Jardin",
    type: "Jardin exotique",
    ville: "Gabès",
    note: 4.8,
    prix: "3400",
    description: "Oasis de verdure dans la palmeraie de Gabès",
    evenement: "Mariage",
    disponible: true,
    capacite: 220,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-14",
    nom: "Le Palais du Désert",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Palais",
    type: "Palais du désert",
    ville: "Douz",
    note: 4.9,
    prix: "5800",
    description: "Palais de sable aux portes du désert de Douz",
    evenement: "Mariage",
    disponible: true,
    capacite: 150,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  // Ligne 3
  {
    id: "etab-15",
    nom: "La Villa Bleue",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Villa",
    type: "Villa contemporaine",
    ville: "Tabarka",
    note: 4.7,
    prix: "4600",
    description: "Villa design avec vue sur la mer à Tabarka",
    evenement: "Mariage",
    disponible: true,
    capacite: 130,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-16",
    nom: "Le Riad des Oliviers",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Riad",
    type: "Riad traditionnel",
    ville: "Mahdia",
    note: 4.8,
    prix: "4200",
    description: "Riad paisible à deux pas de la plage de Mahdia",
    evenement: "Mariage",
    disponible: true,
    capacite: 90,
    parking: false,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-17",
    nom: "Les Jardins de l'Atlas",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Jardin",
    type: "Jardin de montagne",
    ville: "Le Kef",
    note: 4.9,
    prix: "4100",
    description: "Écrin de verdure au pied des montagnes du Kef",
    evenement: "Mariage",
    disponible: true,
    capacite: 180,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: false
  },
  {
    id: "etab-18",
    nom: "Le Domaine des Orangers",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Domaine",
    type: "Domaine agricole",
    ville: "Bizerte",
    note: 4.7,
    prix: "4500",
    description: "Domaine entouré d'orangers avec vue sur la mer à Bizerte",
    evenement: "Mariage",
    disponible: true,
    capacite: 280,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-19",
    nom: "La Villa des Palmiers",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Villa",
    type: "Villa d'exception",
    ville: "Skanes",
    note: 4.9,
    prix: "5200",
    description: "Villa de luxe dans un écrin de verdure à Skanes",
    evenement: "Mariage",
    disponible: true,
    capacite: 160,
    parking: true,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-20",
    nom: "Le Riad des Artistes",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Riad",
    type: "Riad bohème",
    ville: "Sidi Bouzid",
    note: 4.8,
    prix: "3800",
    description: "Riad inspirant dédié aux artistes à Sidi Bouzid",
    evenement: "Mariage",
    disponible: true,
    capacite: 110,
    parking: false,
    climatisation: true,
    terrasse: true,
    piscine: true
  },
  {
    id: "etab-21",
    nom: "Le Jardin des Sens",
    image: "/beautiful-luxurious-wedding-ceremony-hall.jpg",
    categorie: "Jardin",
    type: "Jardin sensoriel",
    ville: "Gafsa",
    note: 4.7,
    prix: "3100",
    description: "Jardin paysager éveillant les sens à Gafsa",
    evenement: "Mariage",
    disponible: true,
    capacite: 190,
    parking: true,
    climatisation: false,
    terrasse: true,
    piscine: true
  }
];

// List of Tunisian cities populated from the establishments data
const tunisianCities = Array.from(new Set(mockEtablissements.map(e => e.ville))).sort();

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
  const filteredEtablissements = mockEtablissements.filter((etab: Etablissement) => {
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
      
      {/* Main Content */}
      <main className="w-full py-6 mt-16 px-10">
        <div className="w-full text-[#333333] pt-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#333333]"></h2>
          </div>

          {/* Search Bar */}
          <div className="relative mt-12">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#3A3A3A]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un etablissement ou une catégorie..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent text-[#3A3A3A] placeholder-[#9CA3AF] text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Category Tabs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-[#333333]"></h2>
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
          {filteredEtablissements.length > 0 ? (
            <div className="space-y-6">
              {/* Map through the establishments in chunks of 7 */}
              {Array.from({ length: Math.ceil(filteredEtablissements.length / 7) }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-4">
                  {filteredEtablissements.slice(rowIndex * 7, (rowIndex + 1) * 7).map((etablissement) => (
                    <CarteEtablissement 
                      key={etablissement.id} 
                      e={etablissement} 
                      reviewCounts={reviewCounts} 
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
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
      </main>
    </div>
  );
}