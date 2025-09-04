'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiStar, FiFilter, FiChevronDown } from 'react-icons/fi';

// Mock data for service providers
const providers = [
  {
    id: 1,
    name: 'Studio Photo Élégance',
    category: 'Photographe',
    location: 'Tunis',
    rating: 4.9,
    reviews: 128,
    price: 'À partir de 2500 DT',
    image: '/Studio Photo Créatif.jpg',
    featured: true,
    services: ['Mariage', 'Fiançailles', 'Événements d\'entreprise'],
    description: 'Capturer les moments magiques de votre événement avec notre équipe professionnelle.'
  },
  {
    id: 2,
    name: 'Traiteur Saveurs du Sud',
    category: 'Traiteur',
    location: 'Sousse',
    rating: 4.8,
    reviews: 156,
    price: 'À partir de 1800 DT',
    image: 'https://images.unsplash.com/photo-1544025162-1fdfa4709148?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true,
    services: ['Mariage', 'Anniversaire', 'Cocktail', 'Buffet'],
    description: 'Une cuisine raffinée qui met en valeur les saveurs locales avec une touche créative.'
  },
  {
    id: 3,
    name: 'Orchestre Harmonie',
    category: 'Animation',
    location: 'Hammamet',
    rating: 4.7,
    reviews: 94,
    price: 'À partir de 3500 DT',
    image: '/Quatuor Classique.jpg',
    featured: false,
    services: ['Mariage', 'Soirée privée', 'Événements d\'entreprise'],
    description: 'Une expérience musicale exceptionnelle pour rendre votre événement inoubliable.'
  },
  {
    id: 4,
    name: 'Atelier Floral',
    category: 'Fleuriste',
    location: 'La Marsa',
    rating: 4.9,
    reviews: 87,
    price: 'À partir de 1200 DT',
    image: '/Fleurs d\'Exception.jpg',
    featured: true,
    services: ['Mariage', 'Décoration', 'Centres de table'],
    description: 'Des créations florales uniques qui apportent élégance et fraîcheur à votre événement.'
  },
  {
    id: 5,
    name: 'Lumière et Son Pro',
    category: 'Éclairage & Son',
    location: 'Tunis',
    rating: 4.6,
    reviews: 65,
    price: 'À partir de 2000 DT',
    image: '/DJ & Musiciens.jpg',
    featured: false,
    services: ['Mariage', 'Concert', 'Événements d\'entreprise'],
    description: 'Des solutions complètes d\'éclairage et de son pour une ambiance parfaite.'
  },
  {
    id: 6,
    name: 'Maquillage Événementiel',
    category: 'Beauté',
    location: 'Sfax',
    rating: 4.8,
    reviews: 112,
    price: 'À partir de 800 DT',
    image: '/Beauté Pure.jpg',
    featured: false,
    services: ['Mariage', 'Soirée', 'Shooting photo'],
    description: 'Mettez en valeur votre beauté naturelle avec un maquillage professionnel adapté à votre style.'
  },
  {
    id: 7,
    name: 'Salle des Fêtes Le Paradis',
    category: 'Salle de réception',
    location: 'Tunis',
    rating: 4.9,
    reviews: 215,
    price: 'À partir de 5000 DT',
    image: '/Salle de Bal Moderne.jpg',
    featured: true,
    services: ['Mariage', 'Anniversaire', 'Gala'],
    description: 'Un cadre exceptionnel pour vos événements les plus prestigieux.'
  },
  {
    id: 8,
    name: 'DJ Samy Beats',
    category: 'Animation',
    location: 'Sousse',
    rating: 4.8,
    reviews: 178,
    price: 'À partir de 1500 DT',
    image: '/DJ Sami.jpg',
    featured: true,
    services: ['Mariage', 'Soirée privée', 'Club'],
    description: 'Ambiance garantie avec nos DJs professionnels.'
  },
  {
    id: 9,
    name: 'Pâtisserie Douceurs',
    category: 'Traiteur',
    location: 'La Marsa',
    rating: 4.9,
    reviews: 203,
    price: 'À partir de 1200 DT',
    image: 'https://images.unsplash.com/photo-1571844307880-751c6d86f54f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true,
    services: ['Pièces montées', 'Desserts', 'Buffet sucré'],
    description: 'Des créations pâtissières qui émerveilleront vos invités.'
  },
  {
    id: 10,
    name: 'Studio de Danse Orientale',
    category: 'Animation',
    location: 'Tunis',
    rating: 4.7,
    reviews: 142,
    price: 'À partir de 2000 DT',
    image: '/Show Time.jpg',
    featured: false,
    services: ['Spectacle', 'Cours', 'Animation'],
    description: 'Des danseuses professionnelles pour animer votre événement.'
  },
  {
    id: 11,
    name: 'Agence Événementielle Prestige',
    category: 'Organisation',
    location: 'Tunis',
    rating: 5.0,
    reviews: 321,
    price: 'Sur devis',
    image: '/Lieux de Réception.jpg',
    featured: true,
    services: ['Mariage', 'Événement d\'entreprise', 'Lancement de produit'],
    description: 'Une organisation parfaite pour des événements réussis.'
  },
  {
    id: 12,
    name: 'Location de Mobilier Chic',
    category: 'Location',
    location: 'Sousse',
    rating: 4.6,
    reviews: 98,
    price: 'À partir de 800 DT',
    image: '/Décoration de table.jpg',
    featured: false,
    services: ['Mobilier', 'Décoration', 'Éclairage'],
    description: 'Un large choix de mobilier pour tous vos événements.'
  },
  {
    id: 13,
    name: 'Photobooth Original',
    category: 'Animation',
    location: 'Hammamet',
    rating: 4.8,
    reviews: 156,
    price: 'À partir de 900 DT',
    image: '/Photobooth vintage.jpg',
    featured: true,
    services: ['Mariage', 'Anniversaire', 'Événement d\'entreprise'],
    description: 'Animation photobooth avec accessoires et impressions instantanées.'
  },
  {
    id: 14,
    name: 'Traiteur Oriental',
    category: 'Traiteur',
    location: 'Tunis',
    rating: 4.9,
    reviews: 234,
    price: 'À partir de 2200 DT',
    image: 'https://images.unsplash.com/photo-1544025162-1fdfa4709148?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true,
    services: ['Cuisine tunisienne', 'Cuisine orientale', 'Buffet froid et chaud'],
    description: 'Découvrez les saveurs authentiques de la cuisine orientale.'
  },
  {
    id: 15,
    name: 'Agence de Communication',
    category: 'Communication',
    location: 'Tunis',
    rating: 4.7,
    reviews: 187,
    price: 'Sur devis',
    image: '/Cartes & Co.jpg',
    featured: false,
    services: ['Stratégie', 'Création', 'Suivi'],
    description: 'Une communication sur mesure pour votre événement.'
  },
  {
    id: 16,
    name: 'Location de Voitures de Luxe',
    category: 'Transport',
    location: 'Tunis',
    rating: 4.8,
    reviews: 156,
    price: 'À partir de 1500 DT',
    image: '/Prestige Cars.jpg',
    featured: true,
    services: ['Mariage', 'Événement professionnel', 'Transfert VIP'],
    description: 'Parc automobile de prestige avec chauffeur professionnel.'
  },
  {
    id: 17,
    name: 'Agence de Voyage',
    category: 'Voyage',
    location: 'Sousse',
    rating: 4.9,
    reviews: 201,
    price: 'Sur devis',
    image: '/Villa Événementielle.jpg',
    featured: true,
    services: ['Séminaire', 'Incentive', 'Voyage de noces'],
    description: 'Organisation complète de vos voyages d\'affaires et événementiels.'
  },
  {
    id: 18,
    name: 'Location de Tentes',
    category: 'Location',
    location: 'Hammamet',
    rating: 4.7,
    reviews: 132,
    price: 'À partir de 3000 DT',
    image: '/Tente de réception.jpg',
    featured: false,
    services: ['Mariage', 'Fête privée', 'Événement d\'entreprise'],
    description: 'Structures adaptées à tous types d\'événements en extérieur.'
  },
  {
    id: 19,
    name: 'Agence de Mannequins',
    category: 'Animation',
    location: 'Tunis',
    rating: 4.8,
    reviews: 178,
    price: 'Sur devis',
    image: '/Rêve de Mariée.jpg',
    featured: true,
    services: ['Hôtesse', 'Promotion', 'Animation'],
    description: 'Des hôtesses et modèles professionnels pour votre événement.'
  },
  {
    id: 20,
    name: 'Studio Vidéo Pro',
    category: 'Audiovisuel',
    location: 'La Marsa',
    rating: 4.9,
    reviews: 198,
    price: 'À partir de 2800 DT',
    image: 'https://images.unsplash.com/photo-1571844307880-751c6d86f54f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: true,
    services: ['Reportage', 'Film institutionnel', 'Montage vidéo'],
    description: 'Captation et production vidéo professionnelle pour votre événement.'
  },
  {
    id: 21,
    name: 'Agence de Décoration',
    category: 'Décoration',
    location: 'Sfax',
    rating: 4.9,
    reviews: 245,
    price: 'Sur devis',
    image: '/Ambiance élégant.jpg',
    featured: true,
    services: ['Mariage', 'Anniversaire', 'Événement d\'entreprise'],
    description: 'Des décors uniques et personnalisés pour des événements mémorables.'
  }
];

const categories = [
  { id: 'all', name: 'Tous', count: 215 },
  { id: 'Photographe', name: 'Photographe', count: 32 },
  { id: 'Traiteur', name: 'Traiteur', count: 28 },
  { id: 'Animation', name: 'Animation', count: 25 },
  { id: 'Fleuriste', name: 'Fleuriste', count: 18 },
  { id: 'Beauté', name: 'Beauté', count: 22 },
  { id: 'Éclairage & Son', name: 'Éclairage & Son', count: 15 },
  { id: 'Salle de réception', name: 'Salles', count: 12 },
  { id: 'Location', name: 'Location', count: 20 },
  { id: 'Organisation', name: 'Organisation', count: 15 },
  { id: 'Décoration', name: 'Décoration', count: 18 },
  { id: 'Transport', name: 'Transport', count: 10 },
  { id: 'Audiovisuel', name: 'Audiovisuel', count: 8 },
  { id: 'Communication', name: 'Communication', count: 5 },
  { id: 'Voyage', name: 'Voyage', count: 7 },
];

export default function PrestatairesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for filters
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Filter providers based on all filters
  const filteredProviders = providers.filter(provider => {
    // Search filter
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    
    // Location filter
    const matchesLocation = selectedLocation === 'all' || provider.location === selectedLocation;
    
    // Price filter
    let matchesPrice = true;
    if (priceFilter !== 'all') {
      const price = parseInt(provider.price.replace(/\D/g, '')) || 0;
      if (priceFilter === 'lt1000' && price >= 1000) matchesPrice = false;
      if (priceFilter === '1000-2000' && (price < 1000 || price > 2000)) matchesPrice = false;
      if (priceFilter === '2000-5000' && (price < 2000 || price > 5000)) matchesPrice = false;
      if (priceFilter === 'gt5000' && price <= 5000) matchesPrice = false;
    }
    
    // Rating filter
    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      if (provider.rating < minRating) matchesRating = false;
    }
    
    // Event type filter
    let matchesEventType = true;
    if (eventTypeFilter !== 'all') {
      matchesEventType = provider.services.some(service => 
        service.toLowerCase().includes(eventTypeFilter.toLowerCase())
      );
    }
    
    return matchesSearch && matchesCategory && matchesLocation && 
           matchesPrice && matchesRating && matchesEventType;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1CCFC9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Chargement des prestataires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/prestataire.jpg"
            alt="Prestataires de services"
            layout="fill"
            objectFit="cover"
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60 z-10"></div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Trouvez le prestataire idéal
          </motion.h1>
          <motion.p 
            className="text-xl text-white/90 max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Découvrez les meilleurs professionnels pour votre événement
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 -mt-12 relative z-30">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un prestataire..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#F16462] focus:border-transparent"
              >
                <option value="all">Toutes les villes</option>
                {Array.from(new Set(providers.map(p => p.location))).map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 bg-[#F16462] hover:bg-[#e05554] text-white px-6 py-3 rounded-lg transition-colors"
            >
              <FiFilter />
              <span>Filtres</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Filtrer par :</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix max</label>
                  <select 
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Tous les prix</option>
                    <option value="lt1000">Moins de 1000 DT</option>
                    <option value="1000-2000">1000 - 2000 DT</option>
                    <option value="2000-5000">2000 - 5000 DT</option>
                    <option value="gt5000">Plus de 5000 DT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note minimale</label>
                  <select 
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les notes</option>
                    <option value="4.5">4.5+</option>
                    <option value="4.0">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3.0">3.0+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
                  <select 
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Tous les événements</option>
                    {Array.from(new Set(providers.flatMap(p => p.services))).map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                  <select 
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois-ci</option>
                    <option value="3months">Dans les 3 mois</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Categories */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Catégories</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                    selectedCategory === category.id
                      ? 'bg-[#F16462] text-white shadow-md transform -translate-y-0.5'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Providers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {filteredProviders.slice(0, 21).map((provider) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#F16462]/30"
            >
              <div className="relative h-40">
                <Image
                  src={provider.image}
                  alt={provider.name}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{provider.name}</h3>
                  <div className="flex items-center bg-[#F16462]/10 text-[#F16462] text-xs font-semibold px-1.5 py-0.5 rounded">
                    <FiStar className="mr-0.5 text-xs" fill="#F16462" />
                    {provider.rating}
                    <span className="text-gray-400 text-[10px] ml-0.5">({provider.reviews})</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mb-2 flex items-center">
                  <FiMapPin className="inline mr-1 text-[10px]" />
                  {provider.location}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#F16462] text-sm font-bold">{provider.price}</span>
                  <button className="text-white bg-[#F16462] hover:bg-[#e05554] px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
                    Réserver
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}