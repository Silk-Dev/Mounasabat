'use client';

import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, MapPinIcon, CalendarIcon, UsersIcon, HeartIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Header from "@/components/Header";

interface Service {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  type: string;
  category: string;
}

interface Destination {
  name: string;
  image: string;
  count: string;
}

interface HomepageData {
  services: Service[];
  popularDestinations: Destination[];
}

export default function Home() {
  const router = useRouter();
  const [searchDestination, setSearchDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch homepage data on component mount
  useEffect(() => {
    async function fetchHomepageData() {
      try {
        setLoading(true);
        const response = await fetch('/api/homepage');
        const result = await response.json();
        
        if (result.success) {
          setHomepageData(result.data);
        } else {
          setError('Failed to load data');
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomepageData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/recherche/etablissement?destination=${encodeURIComponent(searchDestination)}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#F16462]"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !homepageData) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error || 'Failed to load page data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#F16462] text-white px-6 py-2 rounded-lg hover:bg-[#e55a5a]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { services, popularDestinations } = homepageData;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section with Search */}
      <section className="relative pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-md mx-auto sm:max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Trouvez tout pour votre événement parfait
            </h1>
            <p className="text-xs sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez des lieux uniques et des prestataires de confiance pour créer des moments inoubliables
            </p>
          </div>

          {/* Mobile-First Search Bar */}
          <div className="w-full">
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              {/* Mobile: Stacked Layout */}
              <div className="block sm:hidden space-y-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <MapPinIcon className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Où"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      placeholder="Arrivée"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      placeholder="Départ"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-[#F16462] hover:bg-[#e55a5a] text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Rechercher
                </button>
              </div>

              {/* Desktop: Horizontal Layout */}
              <div className="hidden sm:flex items-center">
                <div 
                  className={`flex-1 px-4 py-3 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'destination' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('destination')}
                >
                  <label className="block text-xs font-medium text-gray-700 mb-1">Où</label>
                  <input
                    type="text"
                    placeholder="Rechercher une destination"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    onFocus={() => setActiveSearchField('destination')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 placeholder-gray-400 bg-transparent border-none outline-none text-sm"
                  />
                </div>

                <div className="w-px h-6 bg-gray-300"></div>

                <div 
                  className={`flex-1 px-4 py-3 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'checkin' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('checkin')}
                >
                  <label className="block text-xs font-medium text-gray-700 mb-1">Arrivée</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    onFocus={() => setActiveSearchField('checkin')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 bg-transparent border-none outline-none text-sm"
                  />
                </div>

                <div className="w-px h-6 bg-gray-300"></div>

                <div 
                  className={`flex-1 px-4 py-3 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'checkout' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('checkout')}
                >
                  <label className="block text-xs font-medium text-gray-700 mb-1">Départ</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    onFocus={() => setActiveSearchField('checkout')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 bg-transparent border-none outline-none text-sm"
                  />
                </div>

                <div className="w-px h-6 bg-gray-300"></div>

                <div 
                  className={`flex-1 px-4 py-3 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'guests' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('guests')}
                >
                  <label className="block text-xs font-medium text-gray-700 mb-1">Invités</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    onFocus={() => setActiveSearchField('guests')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 bg-transparent border-none outline-none text-sm"
                  >
                    <option value="1">1 invité</option>
                    <option value="10">10 invités</option>
                    <option value="25">25 invités</option>
                    <option value="50">50 invités</option>
                    <option value="100">100 invités</option>
                    <option value="200">200+ invités</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-[#F16462] hover:bg-[#e55a5a] text-white p-3 rounded-full ml-1 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* All Listings Section */}
      <section className="py-6 px-4 sm:px-6">
        <div className="max-w-md mx-auto sm:max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {services.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                onClick={() => router.push(`/${listing.category}/${listing.id}`)}
                className="group cursor-pointer bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative overflow-hidden bg-gray-100 aspect-square">
                  <Image
                    src={listing.image}
                    alt={listing.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button className="absolute top-3 right-3 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <HeartIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="absolute top-3 left-3 bg-white/95 px-2 py-1 rounded-md shadow-sm">
                    <span className="text-xs font-medium text-gray-700">{listing.type}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-white/95 px-2 py-1 rounded-md shadow-sm">
                    <StarIconSolid className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-700">{listing.rating}</span>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">{listing.name}</h3>
                  <p className="text-gray-500 text-xs">{listing.location}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold text-sm">
                      {listing.price} DH 
                      <span className="font-normal text-gray-500 text-xs">
                        {listing.category === 'catering' ? '/pers' : 
                         listing.category === 'equipment' ? '/jour' : 
                         '/event'}
                      </span>
                    </p>
                    <p className="text-gray-400 text-xs">({listing.reviews})</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-8 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-md mx-auto sm:max-w-7xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Destinations populaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {popularDestinations.map((destination, index) => (
              <motion.div
                key={destination.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/recherche/etablissement?destination=${encodeURIComponent(destination.name)}`)}
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-square">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-2 left-2 text-white">
                    <h3 className="text-sm font-semibold">{destination.name}</h3>
                    <p className="text-xs opacity-90">{destination.count}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto sm:max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Organisez votre événement parfait en 3 étapes simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F16462] rounded-full flex items-center justify-center mx-auto mb-6">
                <MagnifyingGlassIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">1. Recherchez</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Trouvez les prestataires et lieux qui correspondent à vos besoins et votre budget
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1BA3A9] rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2. Réservez</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Contactez directement les prestataires et réservez vos dates en toute simplicité
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F16462] rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">3. Célébrez</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Profitez de votre événement parfait avec des prestataires de confiance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-r from-[#F16462] to-[#1BA3A9]">
        <div className="max-w-md mx-auto sm:max-w-4xl text-center text-white">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">Prêt à organiser votre événement ?</h2>
          <p className="text-base sm:text-xl opacity-90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'organisateurs qui nous font confiance pour créer des moments inoubliables
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-[#F16462] hover:bg-gray-100 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-colors"
            >
              Commencer ma recherche
            </button>
            <button
              onClick={() => router.push('/prestataires')}
              className="border-2 border-white hover:bg-white/10 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-colors"
            >
              Devenir prestataire
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}