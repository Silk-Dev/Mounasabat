'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Provider {
  id: string;
  nom: string;
  photo: string;
  note: number;
  avis: number;
  ville: string;
  membreDepuis: string;
}

interface Item {
  id: string;
  nom: string;
  image: string;
  type: string;
  note: number;
  prix: string;
  ville: string;
  description: string;
  categories: string[];
  disponible: boolean;
  galleryImages?: string[];
  provider: Provider;
  capacite?: number;
  chambres?: number;
  parking?: boolean;
  climatisation?: boolean;
  terrasse?: boolean;
  piscine?: boolean;
}

interface ItemDetailProps {
  item: Item;
  category: 'service' | 'etablissement' | 'materiel';
}

export default function ItemDetail({ item, category }: ItemDetailProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  
  const galleryImages = item.galleryImages || [item.image, ...Array(4).fill(0).map((_, i) => `/images/placeholder-${i+1}.jpg`)];

  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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
          <svg key={`empty-${i}`} className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-gray-600 ml-2">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
        
        {/* Provider Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src={item.provider.photo || '/default-avatar.png'}
                alt={item.provider.nom}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{item.provider.nom}</h2>
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 font-medium">{item.provider.note.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm ml-2">({item.provider.avis} avis)</span>
                </div>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-600">{item.provider.ville}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-600">Membre depuis {item.provider.membreDepuis}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 bg-gray-100">
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={galleryImages[activeImage]}
                alt={item.nom}
                layout="fill"
                objectFit="cover"
                className="transition-opacity duration-300"
                priority
              />
            </div>
            
            {/* Thumbnail Navigation */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${activeImage === index ? 'bg-white' : 'bg-white/50'}`}
                  aria-label={`Voir l'image ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-colors"
              aria-label="Image précédente"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setActiveImage((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-colors"
              aria-label="Image suivante"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="md:w-2/3 md:pr-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.nom}</h1>
                <div className="flex items-center space-x-4 mb-6">
                  <StarRating rating={item.note} />
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">{item.ville}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">{item.type}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.categories.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {category}
                    </span>
                  ))}
                </div>

                <div className="prose max-w-none text-gray-700 mb-8">
                  <p className="text-lg">{item.description}</p>
                </div>
              </div>

              <div className="md:w-1/3 mt-8 md:mt-0">
                <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-2xl font-bold">{item.prix} €</span>
                      <span className="text-gray-600"> / {category === 'service' ? 'prestation' : category === 'etablissement' ? 'nuit' : 'jour'}</span>
                    </div>
                    <div className="flex items-center">
                      <StarRating rating={item.note} />
                      <span className="text-gray-600 ml-1">(24 avis)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Dates disponibles</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sélectionnez une date</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
