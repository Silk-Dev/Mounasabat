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

const VenueCard = ({ venue, index }: { venue: any, index: number }) => {
  // Mock rating for now
  const rating = 4.5 + (index % 5 * 0.1);
  const reviewCount = Math.floor(Math.random() * 50) + 5;
  const isAvailable = Math.random() > 0.1; // 90% chance of being available

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div className="relative mb-2">
        <div className="aspect-square overflow-hidden rounded-2xl relative w-full min-h-[200px]">
          <Image
            src={venue.image}
            alt={venue.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-2xl"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <button 
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white"
            onClick={(e) => e.preventDefault()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-2xl">
              <span className="text-white font-medium bg-red-500 px-3 py-1 rounded-full text-sm">Indisponible</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-gray-900 line-clamp-1">{venue.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StarRating rating={rating} />
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          </div>
          <span className="text-xs text-gray-500">{venue.location}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-900 font-medium">{venue.price}</span>
          <span className="text-xs text-gray-500">Capacité: {venue.capacity}</span>
        </div>
      </div>
    </motion.div>
  );
};

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
            <h1 className="text-5xl font-bold mb-4">Luxe Occasion</h1>
            <p className="text-xl max-w-2xl mx-auto">Découvrez nos prestations haut de gamme pour des événements d'exception</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {venues.map((venue, index) => (
            <VenueCard venue={venue} index={index} key={venue.id} />
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