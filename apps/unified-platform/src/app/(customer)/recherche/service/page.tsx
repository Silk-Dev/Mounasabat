"use client";
import Image from "next/image";
import { useState } from "react";
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

function CarteService({ service }: { service: Service }) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={service.image}
          alt={service.nom}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      {/* Service Name */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm">{service.nom}</h3>
      </div>
    </div>
  );
}

const mockServices: Service[] = [
  // Photographes
  {
    id: "1",
    nom: "Studio Photo Créatif",
    type: "Photographie",
    note: 4.8,
    prix: "1500 TND",
    ville: "Tunis",
    image: "/photographe1.jpg",
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
  
  // DJ & Musique
  {
    id: "3",
    nom: "DJ Sami",
    type: "DJ",
    note: 4.7,
    prix: "1800 TND",
    ville: "Tunis",
    image: "/dj1.jpg",
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
    image: "/decoration1.jpg",
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
    image: "/salle1.jpg",
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
    image: "/robe1.jpg",
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
    image: "/costume1.jpg",
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
    image: "/coiffure1.jpg",
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
    image: "/maquillage1.jpg",
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
    image: "/voiture1.jpg",
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
    image: "/patisserie1.jpg",
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
    image: "/musiciens1.jpg",
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
    image: "/videaste1.jpg",
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
    image: "/lieu1.jpg",
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
    image: "/eclairage1.jpg",
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
    image: "/invitations1.jpg",
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
    image: "/animation1.jpg",
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
    image: "/fleuriste1.jpg",
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
    image: "/photobooth1.jpg",
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
  { id: 1, name: 'Photographe', emoji: '📸' },
  { id: 2, name: 'DJ', emoji: '🎧' },
  { id: 3, name: 'Traiteur', emoji: '🍽️' },
  { id: 4, name: 'Salle', emoji: '🏛️' },
  { id: 5, name: 'Décoration', emoji: '🎨' },
  { id: 6, name: 'Fleuriste', emoji: '🌸' },
  { id: 7, name: 'Animation', emoji: '🎭' },
  { id: 8, name: 'Costume', emoji: '👔' },
  { id: 9, name: 'Robe', emoji: '👰' },
  { id: 10, name: 'Coiffure', emoji: '💇' },
  { id: 11, name: 'Maquillage', emoji: '💄' },
  { id: 12, name: 'Voiture', emoji: '🚗' },
  { id: 13, name: 'Pâtisserie', emoji: '🍰' },
  { id: 14, name: 'Musiciens', emoji: '🎻' },
  { id: 15, name: 'Vidéaste', emoji: '🎥' },
  { id: 16, name: 'Lieu insolite', emoji: '🏰' },
  { id: 17, name: 'Éclairage', emoji: '💡' },
  { id: 18, name: 'Invitations', emoji: '✉️' },
];

export default function ServicePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Filtrer les services en fonction de la recherche et de la catégorie sélectionnée
  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || 
      service.categories.some(cat => 
        cat.toLowerCase() === serviceCategories.find(c => c.id === selectedCategory)?.name.toLowerCase()
      );
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 pb-12">
        {/* Barre de recherche */}
        <div className="max-w-2xl mx-auto mb-8 px-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un service..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent text-base shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories horizontal scroll */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 px-2">Catégories</h2>
          <div className="relative">
            <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide">
              {serviceCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  className={`flex flex-col items-center flex-shrink-0 w-24 ${selectedCategory === category.id ? 'text-[#F16462]' : 'text-gray-700'} hover:text-[#F16462] transition-colors`}
                >
                  <div className={`w-16 h-16 rounded-full mb-2 flex items-center justify-center text-3xl ${selectedCategory === category.id ? 'bg-[#FEF0EF]' : 'bg-gray-50'}`}>
                    {category.emoji}
                  </div>
                  <span className="text-xs font-medium text-center">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 px-4">Tous les services</h2>
          
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-4">
              {filteredServices.map((service) => (
                <CarteService key={service.id} service={service} />
              ))}
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
      </main>
    </div>
  );
}
  