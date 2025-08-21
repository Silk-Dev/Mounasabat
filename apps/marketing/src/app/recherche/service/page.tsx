"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import Header from "@/app/components/Header";

interface Service {
  id: string;
  nom: string;
  image: string;
  type: string;
  note: number;
  prix: string;
  ville: string;
  disponible: boolean;
  categories: string[];
  description: string;
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

const CarteService = ({ service, reviewCounts }: { service: Service; reviewCounts: Record<string, number> }) => {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#F16462]/30">
      <div className="relative pb-[100%] bg-gray-50">
        <Image 
          src={service.image} 
          alt={service.nom}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          priority={false}
          loading="lazy"
        />
        {!service.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium text-sm bg-[#F16462] px-2 py-1 rounded">Complet</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 h-12 text-sm md:text-base">
          {service.nom}
        </h3>
        <div className="flex items-center mb-1">
          <StarRating rating={service.note} />
          <span className="ml-1 text-xs text-gray-500">
            {service.note} ({reviewCounts[service.id] || 0} avis)
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[#F16462] font-semibold text-sm md:text-base">
              {service.prix}
              <span className="text-gray-500 text-xs font-normal ml-1">/jour</span>
            </span>
            <div className="flex items-center text-gray-500 text-xs">
              <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {service.ville}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mockServices: Service[] = [
  // Photographes
  {
    id: "1",
    nom: "Studio Photo Créatif",
    type: "Photographie",
    note: 4.8,
    prix: "1500 TND",
    ville: "Tunis",
    image: "/Studio Photo Créatif.jpg",
    disponible: true,
    categories: ["photographe"],
    description: "Photographe professionnel spécialisé dans les mariages et événements.",
  },
  {
    id: "2",
    nom: "Momentum Photos",
    type: "Photographie",
    note: 4.9,
    prix: "2500 TND",
    ville: "Sousse",
    image: "/Photographes.jpg",
    disponible: true,
    categories: ["photographe", "video"],
    description: "Reportage photo professionnel pour capturer les moments inoubliables de votre mariage.",
  },
  {
    id: "22",
    nom: "Studio Lumière d'Or",
    type: "Photographie",
    note: 4.9,
    prix: "2200 TND",
    ville: "Sfax",
    image: "/studio-lumiere-dor.jpg",
    disponible: true,
    categories: ["photographe", "studio"],
    description: "Studio photo haut de gamme avec éclairage professionnel pour des clichés exceptionnels.",
  },
  {
    id: "23",
    nom: "Prestige Vidéo",
    type: "Vidéaste",
    note: 4.8,
    prix: "3000 TND",
    ville: "Tunis",
    image: "/prestige-video.jpg",
    disponible: true,
    categories: ["video", "mariage"],
    description: "Captation vidéo cinématique pour immortaliser votre mariage avec élégance.",
  },
  
  // DJ & Musique
  {
    id: "3",
    nom: "DJ Sami",
    type: "DJ",
    note: 4.7,
    prix: "1800 TND",
    ville: "Tunis",
    image: "/DJ Sami.jpg",
    disponible: true,
    categories: ["dj", "musique"],
    description: "Animation musicale moderne avec DJ professionnel et sonorisation complète.",
  },
  
  // Traiteurs
  {
    id: "4",
    nom: "Traiteur Gourmet",
    type: "Traiteur",
    note: 4.6,
    prix: "1800 TND",
    ville: "Hammamet",
    image: "/Traiteurs.jpg",
    disponible: true,
    categories: ["traiteur", "nourriture"],
    description: "Cuisine raffinée pour vos événements spéciaux. Menus personnalisables.",
  },
  
  // Décoration
  {
    id: "5",
    nom: "Fleurs & Décors",
    type: "Décoration",
    note: 4.8,
    prix: "2200 TND",
    ville: "Tunis",
    image: "/floral decorations .jpg",
    disponible: true,
    categories: ["decoration", "fleurs"],
    description: "Décoration florale et scénographie sur mesure pour votre événement.",
  },
  
  // Salles
  {
    id: "6",
    nom: "Palais des Fêtes",
    type: "Salle",
    note: 4.9,
    prix: "5000 TND",
    ville: "Sousse",
    image: "/Palais des Fêtes.jpg",
    disponible: true,
    categories: ["salle", "reception"],
    description: "Magnifique salle de réception avec vue sur la mer pour votre grand jour.",
  },
  
  // Robes de mariée
  {
    id: "7",
    nom: "Rêve de Mariée",
    type: "Robe",
    note: 4.9,
    prix: "3500 TND",
    ville: "Tunis",
    image: "/Rêve de Mariée.jpg",
    disponible: true,
    categories: ["robe", "mariage"],
    description: "Collection exclusive de robes de mariée signées par les plus grands créateurs.",
  },
  
  // Costumes
  {
    id: "8",
    nom: "Le Smoking",
    type: "Costume",
    note: 4.7,
    prix: "1200 TND",
    ville: "Tunis",
    image: "/Le Smoking.jpg",
    disponible: true,
    categories: ["costume", "mariage"],
    description: "Costumes sur mesure pour le marié et ses témoins.",
  },
  
  // Coiffure
  {
    id: "9",
    nom: "Salon Élégance",
    type: "Coiffure",
    note: 4.8,
    prix: "300 TND",
    ville: "Sousse",
    image: "/Salon Élégance.jpg",
    disponible: true,
    categories: ["coiffure", "beaute"],
    description: "Coiffures de mariage élégantes réalisées par des professionnels.",
  },
  
  // Maquillage
  {
    id: "10",
    nom: "Beauté Pure",
    type: "Maquillage",
    note: 4.9,
    prix: "400 TND",
    ville: "Tunis",
    image: "/Beauté Pure.jpg",
    disponible: true,
    categories: ["maquillage", "beaute"],
    description: "Maquillage professionnel pour une beauté éclatante le jour J.",
  },
  
  // Voitures de luxe
  {
    id: "11",
    nom: "Prestige Cars",
    type: "Voiture",
    note: 4.7,
    prix: "1500 TND",
    ville: "Hammamet",
    image: "/Prestige Cars.jpg",
    disponible: true,
    categories: ["voiture", "transport"],
    description: "Location de voitures de luxe pour votre mariage avec chauffeur.",
  },
  
  // Pâtisserie
  {
    id: "12",
    nom: "Délices & Gourmandises",
    type: "Pâtisserie",
    note: 5.0,
    prix: "1200 TND",
    ville: "Tunis",
    image: "/Délices & Gourmandises.jpg",
    disponible: true,
    categories: ["patisserie", "traiteur"],
    description: "Pièces montées et desserts raffinés pour votre réception.",
  },
  
  // Musiciens
  {
    id: "13",
    nom: "Quatuor Classique",
    type: "Musique",
    note: 4.9,
    prix: "2000 TND",
    ville: "Sousse",
    image: "/Quatuor Classique.jpg",
    disponible: true,
    categories: ["musique", "animation"],
    description: "Animation musicale classique pour votre cérémonie et cocktail.",
  },
  
  // Vidéastes
  {
    id: "14",
    nom: "Motion Story",
    type: "Vidéaste",
    note: 4.8,
    prix: "2800 TND",
    ville: "Tunis",
    image: "/Motion Story.jpg",
    disponible: true,
    categories: ["video", "photographe"],
    description: "Film de mariage cinématique pour revivre les émotions de votre journée.",
  },
  
  // Lieux insolites
  {
    id: "15",
    nom: "Le Jardin Secret",
    type: "Lieu Insolite",
    note: 4.9,
    prix: "4500 TND",
    ville: "Hammamet",
    image: "/Le Jardin Secret.jpg",
    disponible: true,
    categories: ["salle", "lieu-insolite"],
    description: "Cadre exceptionnel pour un mariage romantique et intime.",
  },
  
  // Éclairage
  {
    id: "16",
    nom: "Lumière d'Été",
    type: "Éclairage",
    note: 4.7,
    prix: "1800 TND",
    ville: "Tunis",
    image: "/Lumière d'Été.jpg",
    disponible: true,
    categories: ["eclairage", "decoration"],
    description: "Mise en lumière professionnelle pour sublimer votre réception.",
  },
  
  // Invitations
  {
    id: "17",
    nom: "Cartes & Co",
    type: "Invitations",
    note: 4.8,
    prix: "800 TND",
    ville: "Sousse",
    image: "/Cartes & Co.jpg",
    disponible: true,
    categories: ["invitations", "papeterie"],
    description: "Création sur mesure de vos faire-part et supports de communication.",
  },
  
  // Animation
  {
    id: "18",
    nom: "Show Time",
    type: "Animation",
    note: 4.9,
    prix: "3200 TND",
    ville: "Tunis",
    image: "/Show Time.jpg",
    disponible: true,
    categories: ["animation", "spectacle"],
    description: "Spectacles et animations pour une soirée inoubliable.",
  },
  
  // Fleuriste
  {
    id: "19",
    nom: "Fleurs d'Exception",
    type: "Fleuriste",
    note: 4.8,
    prix: "1500 TND",
    ville: "Hammamet",
    image: "/Fleurs d'Exception.jpg",
    disponible: true,
    categories: ["fleurs", "decoration"],
    description: "Compositions florales uniques pour votre mariage.",
  },
  
  // Photobooth
  {
    id: "20",
    nom: "Smile Box",
    type: "Photobooth",
    note: 4.7,
    prix: "1200 TND",
    ville: "Tunis",
    image: "/Smile Box.jpg",
    disponible: true,
    categories: ["animation", "photo"],
    description: "Photobooth amusant avec accessoires pour des souvenirs inoubliables.",
  }
];

const types = ["DJ / Animation", "Photographie", "Beauté", "Traiteur", "Décoration"];
const villes = ["Tunis", "Sousse", "Hammamet", "Sfax", "Djerba"];
const categories = [
  "animation",
  "musique",
  "photo",
  "video",
  "beaute",
  "coiffure",
  "traiteur",
  "nourriture",
  "decoration",
  "fleurs",
];

const serviceCategories = [
  { id: 1, name: 'Photographie' },
  { id: 2, name: 'DJ' },
  { id: 3, name: 'Traiteur' },
  { id: 4, name: 'Salle' },
  { id: 5, name: 'Décoration' },
  { id: 6, name: 'Fleuriste' },
  { id: 7, name: 'Animation' },
  { id: 8, name: 'Costume' },
  { id: 9, name: 'Robe' },
  { id: 10, name: 'Coiffure' },
  { id: 11, name: 'Maquillage' },
  { id: 12, name: 'Voiture' },
  { id: 13, name: 'Pâtisserie' },
  { id: 14, name: 'Musique' },
  { id: 15, name: 'Vidéaste' },
  { id: 16, name: 'Lieu Insolite' },
  { id: 17, name: 'Éclairage' },
  { id: 18, name: 'Invitations' },
  { id: 19, name: 'Photobooth' },
];

export default function ServicePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Générer les compteurs d'avis côté client uniquement
    const counts: Record<string, number> = {};
    mockServices.forEach(service => {
      counts[service.id] = Math.floor(Math.random() * 50) + 5;
    });
    setReviewCounts(counts);
  }, []);

  // Enhanced search functionality
  const filteredServices = mockServices.filter(service => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    // If no search query and no category selected, show all services
    if (searchLower === '' && !selectedCategory) return true;
    
    // Check if matches search query (name, type, or category)
    const matchesSearch = searchLower === '' || 
      service.nom.toLowerCase().includes(searchLower) ||
      service.type.toLowerCase().includes(searchLower) ||
      service.categories.some(cat => 
        cat.toLowerCase().includes(searchLower) ||
        cat.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchLower.replace(/[^a-z0-9]/g, ''))
      );
    
    // Check if matches selected category
    const matchesCategory = !selectedCategory || 
      service.type.toLowerCase() === serviceCategories.find(c => c.id === selectedCategory)?.name.toLowerCase() ||
      service.categories.some(cat => 
        cat.toLowerCase() === serviceCategories.find(c => c.id === selectedCategory)?.name.toLowerCase()
      );
    
    // Return true only if both conditions are met
    return matchesSearch && matchesCategory;
  });
  
  // Sort by rating (highest first) and then by name
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (a.note !== b.note) return b.note - a.note;
    return a.nom.localeCompare(b.nom);
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="bg-white border-b border-gray-100 mt-12 px-4">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Barre de recherche */}
            <div className="relative mt-10">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher un service, une catégorie..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent text-base shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Catégories */}
            <div className="overflow-x-auto pb-3 -mx-2 mt-4">
              <div className="flex space-x-2 px-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === null 
                      ? 'bg-[#F16462] text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {serviceCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category.id 
                        ? 'bg-[#F16462] text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full py-6 mt-4 px-10">
        {/* Services Grid */}
        <div className="w-full">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tous les services</h2>
          
          {sortedServices.length > 0 ? (
            <div className="space-y-8">
              <div className="text-sm text-gray-500 px-4 mt-2">
                {sortedServices.length} service{sortedServices.length !== 1 ? 's' : ''} trouvé{sortedServices.length !== 1 ? 's' : ''}
                {searchQuery && (
                  <span> pour "{searchQuery}"</span>
                )}
                {selectedCategory && (
                  <span> dans "{serviceCategories.find(c => c.id === selectedCategory)?.name}"</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 mt-4 w-full">
                {sortedServices.map((service) => (
                  <CarteService key={service.id} service={service} reviewCounts={reviewCounts} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucun service trouvé
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Essayez de modifier vos critères de recherche.
              </p>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}      