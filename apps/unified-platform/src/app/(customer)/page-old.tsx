'use client';

import React, { useState } from "react";
import { motion } from 'framer-motion';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";
import Header from "@/components/Header";

export default function Home() {
  const router = useRouter();
  const [searchDestination, setSearchDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/recherche/etablissement?destination=${encodeURIComponent(searchDestination)}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`);
  };

  const categories = [
    {
      title: 'Lieux de réception',
      description: 'Salles, châteaux, jardins pour vos événements',
      image: '/lieu de mariage.jpg',
      href: '/recherche/etablissement',
      count: '120+ lieux'
    },
    {
      title: 'Photographes',
      description: 'Professionnels de la photo et vidéo',
      image: '/Photographes.jpg',
      href: '/recherche/service?category=photographe',
      count: '85+ photographes'
    },
    {
      title: 'Traiteurs',
      description: 'Services de restauration et pâtisserie',
      image: '/Traiteurs.jpg',
      href: '/recherche/service?category=traiteur',
      count: '60+ traiteurs'
    },
    {
      title: 'Matériel',
      description: 'Mobilier, décoration, sonorisation',
      image: '/event equipment.jpg',
      href: '/recherche/materiel',
      count: '200+ articles'
    },
    {
      title: 'DJ & Musiciens',
      description: 'Animation musicale pour votre événement',
      image: '/DJ & Musiciens.jpg',
      href: '/recherche/service?category=musique',
      count: '45+ artistes'
    },
    {
      title: 'Fleurs & Décoration',
      description: 'Compositions florales et ornements',
      image: '/floral decorations .jpg',
      href: '/recherche/service?category=decoration',
      count: '30+ décorateurs'
    }
  ];

  const popularDestinations = [
    { name: 'Casablanca', image: '/aab.jpg', count: '120 lieux' },
    { name: 'Marrakech', image: '/aan.jpg', count: '85 lieux' },
    { name: 'Rabat', image: '/back.jpg', count: '65 lieux' },
    { name: 'Fès', image: '/image2.jpg', count: '40 lieux' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section with Search */}
      <section className="relative pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Trouvez tout pour votre événement parfait
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez des lieux uniques et des prestataires de confiance pour créer des moments inoubliables
            </p>
          </div>

          {/* Search Bar - Airbnb Style */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
              <div className="flex items-center">
                {/* Destination */}
                <div 
                  className={`flex-1 px-6 py-4 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'destination' ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('destination')}
                >
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Où</label>
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

                <div className="w-px h-8 bg-gray-300"></div>

                {/* Check in */}
                <div 
                  className={`flex-1 px-6 py-4 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'checkin' ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('checkin')}
                >
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Arrivée</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    onFocus={() => setActiveSearchField('checkin')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 bg-transparent border-none outline-none text-sm"
                  />
                </div>

                <div className="w-px h-8 bg-gray-300"></div>

                {/* Check out */}
                <div 
                  className={`flex-1 px-6 py-4 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'checkout' ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('checkout')}
                >
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Départ</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    onFocus={() => setActiveSearchField('checkout')}
                    onBlur={() => setActiveSearchField(null)}
                    className="w-full text-gray-600 bg-transparent border-none outline-none text-sm"
                  />
                </div>

                <div className="w-px h-8 bg-gray-300"></div>

                {/* Guests */}
                <div 
                  className={`flex-1 px-6 py-4 rounded-full cursor-pointer transition-all ${
                    activeSearchField === 'guests' ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSearchField('guests')}
                >
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Invités</label>
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

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-[#F16462] hover:bg-[#e55a5a] text-white p-4 rounded-full ml-2 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Explorez par catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => router.push(category.href)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] mb-4">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                <p className="text-[#F16462] text-sm font-medium">{category.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Destinations populaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <motion.div
                key={destination.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/recherche/etablissement?destination=${encodeURIComponent(destination.name)}`)}
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-square mb-3">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-lg font-semibold">{destination.name}</h3>
                    <p className="text-sm opacity-90">{destination.count}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Organisez votre événement parfait en 3 étapes simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F16462] rounded-full flex items-center justify-center mx-auto mb-6">
                <MagnifyingGlassIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Recherchez</h3>
              <p className="text-gray-600">
                Trouvez les prestataires et lieux qui correspondent à vos besoins et votre budget
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1BA3A9] rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Réservez</h3>
              <p className="text-gray-600">
                Contactez directement les prestataires et réservez vos dates en toute simplicité
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F16462] rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Célébrez</h3>
              <p className="text-gray-600">
                Profitez de votre événement parfait avec des prestataires de confiance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#F16462] to-[#1BA3A9]">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Prêt à organiser votre événement ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'organisateurs qui nous font confiance pour créer des moments inoubliables
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-[#F16462] hover:bg-gray-100 font-semibold py-4 px-8 rounded-full text-lg transition-colors"
            >
              Commencer ma recherche
            </button>
            <button
              onClick={() => router.push('/prestataires')}
              className="border-2 border-white hover:bg-white/10 font-semibold py-4 px-8 rounded-full text-lg transition-colors"
            >
              Devenir prestataire
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}