"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const venues = [
  {
    id: 1,
    title: 'Salle de Réception Luxueuse',
    location: 'Tunis',
    capacity: '200-300 personnes',
    image: '/Salle de Réception Luxueuse.jpg',
    price: 'À partir de 3000 DT'
  },
  {
    id: 2,
    title: 'Jardin d\'Événements',
    location: 'Sousse',
    capacity: '150-250 personnes',
    image: '/Jardin d\'Événements.jpg',
    price: 'À partir de 2500 DT'
  },
  {
    id: 3,
    title: 'Palais des Fêtes',
    location: 'Hammamet',
    capacity: '300-500 personnes',
    image: '/Palais des Fêtes 2(2).jpg',
    price: 'À partir de 4000 DT'
  },
  {
    id: 4,
    title: 'Salle de Bal Moderne',
    location: 'La Marsa',
    capacity: '100-200 personnes',
    image: '/Salle de Bal Moderne.jpg',
    price: 'À partir de 3500 DT'
  },
  {
    id: 5,
    title: 'Villa Événementielle',
    location: 'Djerba',
    capacity: '50-100 personnes',
    image: '/Villa Événementielle.jpg',
    price: 'À partir de 2000 DT'
  },
  {
    id: 6,
    title: 'Hôtel de Luxe',
    location: 'Yasmine Hammamet',
    capacity: '500+ personnes',
    image: '/Hotel-746-20220930-120435.jpg',
    price: 'À partir de 5000 DT'
  },
];

const categories = [
  { name: 'Tous', count: 25 },
  { name: 'Salles de réception', count: 12 },
  { name: 'Jardins', count: 8 },
  { name: 'Hôtels', count: 15 },
  { name: 'Villas', count: 7 },
];

const VenueCard = ({ venue, index }: { venue: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 h-[400px]"
  >
    <div className="relative h-full w-full">
      <Image
        src={venue.image}
        alt={venue.title}
        layout="fill"
        objectFit="cover"
        className="group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 + index * 0.05 }}
          className="mb-2"
        >
          <span className="inline-block bg-coral-500 text-white text-xs px-3 py-1 rounded-full mb-2">{venue.location}</span>
        </motion.div>
        
        <motion.h3 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          className="text-2xl font-bold mb-2"
        >
          {venue.title}
        </motion.h3>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          className="flex items-center justify-between"
        >
          <span className="text-sm">👥 {venue.capacity}</span>
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            {venue.price}
          </span>
        </motion.div>
      </div>
      
      <motion.div 
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
      >
        <button className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-2 rounded-full font-medium transform -translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          Voir les détails
        </button>
      </motion.div>
    </div>
  </motion.div>
);

export default function LieuxPage() {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1CCFC9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Chargement des lieux exceptionnels...</p>
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
            src="/Lieux de Réception.jpg"
            alt="Lieux de Réception"
            layout="fill"
            objectFit="cover"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white px-4"
          >
            <h1 className="text-5xl font-bold mb-4">Lieux de Réception</h1>
            <p className="text-xl max-w-2xl mx-auto">Découvrez les plus beaux endroits pour organiser votre événement</p>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-6 py-2 rounded-full transition-colors font-medium ${
                activeCategory === category.name
                  ? 'bg-[#F16462] text-white'
                  : 'bg-white text-black hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {venues.map((venue, index) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative h-64">
                <Image
                  src={venue.image}
                  alt={venue.title}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="text-white font-bold text-xl">{venue.title}</div>
                  <div className="text-white/90">{venue.location}</div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-600">
                    <span className="block">Capacité: {venue.capacity}</span>
                  </div>
                  <span className="bg-[#F16462]/10 text-[#F16462] px-3 py-1 rounded-full text-sm font-medium">
                    {venue.price}
                  </span>
                </div>
                <button className="w-full bg-[#F16462] hover:bg-[#e05a58] text-white py-3 rounded-lg font-medium transition-colors">
                  Voir les détails
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16" style={{ background: 'linear-gradient(135deg, #F16462 0%, #FFF1E8 100%)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Vous ne trouvez pas votre bonheur ?</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">Contactez-nous pour des options personnalisées et des recommandations sur mesure.</p>
          <button className="bg-white text-[#F16462] hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors">
            Contactez-nous
          </button>
        </div>
      </div>
    </div>
  );
}