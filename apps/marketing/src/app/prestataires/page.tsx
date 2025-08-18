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
    image: 'https://images.unsplash.com/photo-1526666923129-38a43a9a8d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1501618669935-18b6ec9b1b0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    featured: false,
    services: ['Mariage', 'Soirée', 'Shooting photo'],
    description: 'Mettez en valeur votre beauté naturelle avec un maquillage professionnel adapté à votre style.'
  }
];

const categories = [
  { id: 'all', name: 'Tous', count: 125 },
  { id: 'photographer', name: 'Photographe', count: 32 },
  { id: 'catering', name: 'Traiteur', count: 28 },
  { id: 'music', name: 'Animation', count: 25 },
  { id: 'florist', name: 'Fleuriste', count: 18 },
  { id: 'beauty', name: 'Beauté', count: 22 },
  { id: 'lighting', name: 'Éclairage & Son', count: 15 },
];

export default function PrestatairesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter providers based on search, category and location
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || provider.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
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
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1CCFC9] focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors">
              <FiFilter />
              <span>Filtres</span>
            </button>
          </div>
          
          {/* Categories */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Catégories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#1CCFC9] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} {category.count && `(${category.count})`}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <Image
                  src={provider.image}
                  alt={provider.name}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-300"
                />
                {provider.featured && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                    Mise en avant
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">{provider.name}</h3>
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <FiStar className="text-yellow-400 mr-1" />
                      <span className="text-white text-sm font-medium">{provider.rating}</span>
                      <span className="text-white/70 text-xs ml-1">({provider.reviews})</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <FiMapPin className="text-white/80 text-xs mr-1" />
                    <span className="text-white/80 text-sm">{provider.location}</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  {provider.services.map((service, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {service}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{provider.price}</span>
                  <button className="bg-[#1CCFC9] hover:bg-[#19b8b3] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Voir les détails
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