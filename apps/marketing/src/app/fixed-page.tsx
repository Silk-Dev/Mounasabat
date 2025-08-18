"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

const Home = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('etablissement');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const path = `/recherche/${selectedCategory}`;
    router.push(path);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Planifiez votre événement en toute sérénité
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Trouvez les meilleurs prestataires pour votre mariage, anniversaire ou événement d'entreprise
          </motion.p>

          {/* Search Form */}
          <motion.div 
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Que recherchez-vous ?"
                    className="w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FiSearch className="w-5 h-5" />
                  Rechercher
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span 
              className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              WEDDNI PREMIUM
            </motion.span>
            
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              L'excellence événementielle <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-100">
                à votre portée
              </span>
            </motion.h2>
            
            <motion.p 
              className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Accédez à une sélection exclusive de prestataires vérifiés et bénéficiez d'un accompagnement personnalisé pour votre événement.
            </motion.p>
            
            <motion.button
              className="bg-white text-blue-700 hover:bg-gray-100 font-semibold py-4 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Découvrir l'offre Premium
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
