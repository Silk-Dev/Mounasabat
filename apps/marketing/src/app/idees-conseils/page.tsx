'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCalendar, FiHeart, FiMapPin, FiTag } from 'react-icons/fi';

const articles = [
  {
    id: 1,
    title: '10 Tendances Mariage 2025',
    excerpt: 'Découvrez les tendances qui vont marquer les mariages de cette année.',
    category: 'Inspiration',
    date: '15 Juillet 2025',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1519671482749-5ca0001326a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/tendances-mariage-2025'
  },
  {
    id: 2,
    title: 'Comment Choisir Sa Robe de Mariée',
    excerpt: 'Guide complet pour trouver la robe parfaite pour votre grand jour.',
    category: 'Conseils',
    date: '5 Juillet 2025',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1526667264909-48d1beeeea0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/choisir-robe-mariee'
  },
  {
    id: 3,
    title: 'Budget Mariage : Nos Meilleurs Conseils',
    excerpt: 'Tous nos conseils pour gérer votre budget mariage sans stress.',
    category: 'Budget',
    date: '28 Juin 2025',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/budget-mariage-conseils'
  },
  {
    id: 4,
    title: 'Les Plus Beaux Lieux de Mariage en Tunisie',
    excerpt: 'Découvrez notre sélection des plus beaux endroits pour dire oui.',
    category: 'Lieux',
    date: '20 Juin 2025',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1523438885200-635d00c9dfba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/plus-beaux-lieux-mariage-tunisie'
  },
  {
    id: 5,
    title: 'Checklist Mariage : Le Guide Complet',
    excerpt: 'Ne ratez rien avec notre checklist complète pour organiser votre mariage.',
    category: 'Organisation',
    date: '10 Juin 2025',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1513151233559-d9b56baf524f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/checklist-mariage-complete'
  },
  {
    id: 6,
    title: 'Thèmes de Mariage Originaux',
    excerpt: 'Des idées de thèmes uniques pour un mariage inoubliable.',
    category: 'Inspiration',
    date: '1 Juin 2025',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1519671282429-b446999219b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    url: '/blog/themes-mariage-originaux'
  }
];

const categories = [
  { id: 'all', name: 'Tous les articles' },
  { id: 'inspiration', name: 'Inspiration' },
  { id: 'conseils', name: 'Conseils pratiques' },
  { id: 'budget', name: 'Budget' },
  { id: 'organisation', name: 'Organisation' },
  { id: 'lieux', name: 'Lieux' }
];

export default function IdeesConseilsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1CCFC9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Chargement des articles...</p>
        </div>
      </div>
    );
  }

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/businessman-hand-holding-lightbulb-with-glowing-light-creative-smart-thinking-inspiration-innovation-with-network-concept.jpg"
            alt="Idées et conseils"
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
            Idées & Conseils
          </motion.h1>
          <motion.p 
            className="text-xl text-white/90 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Tous nos conseils et inspirations pour organiser l'événement de vos rêves
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 -mt-12 relative z-30">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#1CCFC9] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <Image
                  src={article.image}
                  alt={article.title}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 text-[#1CCFC9] px-3 py-1 rounded-full text-xs font-semibold">
                  {article.category}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <FiCalendar className="mr-1" size={14} />
                    {article.date}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{article.readTime} de lecture</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <Link href={article.url} className="text-[#1CCFC9] hover:text-[#19b8b3] font-medium flex items-center">
                  Lire l'article <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-[#1CCFC9] to-[#19b8b3] rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Besoin d'aide pour organiser votre événement ?</h2>
            <p className="text-white/90 mb-8 text-lg">Notre équipe d'experts est là pour vous accompagner à chaque étape de l'organisation de votre mariage.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-[#1CCFC9] hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-colors">
                Contactez-nous
              </button>
              <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition-colors">
                Voir nos prestataires
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}