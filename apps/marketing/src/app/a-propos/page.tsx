'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiCheckCircle, FiUsers, FiCalendar, FiMapPin, FiHeart, FiStar, FiShield, FiAward } from 'react-icons/fi';

// Composant pour l'animation des nombres
const AnimatedNumber = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        transition: { duration: 0.5 }
      });
    }
  }, [isInView, controls]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className="inline-block"
    >
      <CountUpNumber value={value} duration={duration} />
    </motion.span>
  );
};

// Composant pour l'effet de comptage
const CountUpNumber = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const increment = value / (duration * 60); // 60 FPS
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(current));
      }
    }, 1000/60);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// Data
const features = [
  {
    title: 'Large Sélection',
    description: 'Accédez à des centaines de prestataires vérifiés pour tous vos besoins événementiels.',
    icon: <FiUsers className="text-white" />,
    image: '/proposition.jpg'
  },
  {
    title: 'Réservation Facile',
    description: 'Réservez en quelques clics et recevez une confirmation instantanée.',
    icon: <FiCalendar className="text-white" />,
    image: '/reservation.jpg'
  },
  {
    title: 'Meilleurs Prix',
    description: 'Profitez des meilleurs tarifs garantis pour tous vos événements.',
    icon: <FiMapPin className="text-white" />,
    image: '/prix.jpg'
  }
];

const values = [
  {
    title: 'Qualité',
    description: 'Nous sélectionnons rigoureusement nos prestataires pour vous garantir une qualité optimale.',
    icon: <FiStar className="text-white" />,
    image: '/qualiter.jpg'
  },
  {
    title: 'Confiance',
    description: 'Votre satisfaction est notre priorité absolue. Nous sommes là pour vous à chaque étape.',
    icon: <FiShield className="text-white" />,
    image: '/confiance.jpg'
  },
  {
    title: 'Passion',
    description: 'Nous mettons tout en œuvre pour que votre événement soit une véritable réussite.',
    icon: <FiHeart className="text-white" />,
    image: '/passion.jpg'
  },
  {
    title: 'Expertise',
    description: 'Notre équipe d\'experts est à votre écoute pour vous conseiller et vous accompagner.',
    icon: <FiAward className="text-white" />,
    image: '/expertise.jpg'
  }
];

const stats = [
  { value: '500+', label: 'Prestataires' },
  { value: '10K+', label: 'Clients satisfaits' },
  { value: '95%', label: 'Taux de satisfaction' },
  { value: '24/7', label: 'Support client' }
];

const APropos = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/back.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Voile noir semi-transparent */}
          <div className="absolute inset-0 bg-black/50"></div>
          
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-16"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-white mb-8"
            >
              Votre Événement, Notre Engagement
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-200 mb-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Découvrez l'excellence dans l'organisation d'événements en Tunisie
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
              >
                Nous contacter <FiArrowRight className="ml-2" />
              </Link>
              <Link 
                href="/prestataires" 
                className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:bg-opacity-10 transition-colors text-lg"
              >
                Découvrir nos prestataires
              </Link>
            </motion.div>
          </motion.div>

          {/* Équipe tunisienne */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-4xl text-white shadow-lg">
                🇹🇳
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">100% Tunisien</h3>
                <p className="text-gray-200 mb-4">
                  Une équipe passionnée et locale qui comprend parfaitement les réalités de l'événementiel en Tunisie.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full border-2 border-white"></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-200">Notre équipe dévouée</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="text-lg font-semibold text-[#F16462] mb-4 inline-block">
              À PROPOS DE NOUS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#3A3A3A]">Une Expérience Unique</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Monasabet révolutionne l'organisation d'événements en Tunisie en offrant une plateforme complète 
              qui vous accompagne de l'inspiration à la réalisation de votre événement de rêve.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative h-64">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${feature.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex flex-col items-center justify-center p-8 text-center">
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-200">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Values Section */}
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#3A3A3A]">Nos Valeurs</h2>
              <p className="text-xl text-gray-600">
                Ces principes guident chacune de nos actions et décisions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-64 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${value.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors duration-300 flex flex-col items-center justify-center p-6 text-center">
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full mb-4">
                        {value.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{value.title}</h3>
                      <p className="text-gray-200">{value.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 text-white bg-gradient-to-r from-[#FFF1E8] via-[#E87D7C] to-[#FFF1E8]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2 text-white">
                  <AnimatedNumber value={parseInt(stat.value.replace(/\D/g, ''))} duration={2} />
                  {stat.value.includes('+') && '+'}
                </div>
                <div className="text-lg text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/souvenir.jpg"
            alt="Souvenirs de mariage"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Prêt à créer des souvenirs inoubliables ?</h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-3xl mx-auto">
            Rejoignez des milliers de clients satisfaits qui nous ont fait confiance pour leur événement spécial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center bg-white text-indigo-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Parler à un expert <FiArrowRight className="ml-2" />
            </Link>
            <Link 
              href="/faq" 
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:bg-opacity-10 transition-colors text-lg"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
      
      {/* Effet de lueur */}
      <div className="absolute -right-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-full filter blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute -left-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-full filter blur-3xl -z-10 animate-pulse-slow animation-delay-2000"></div>
      
      {/* Animation personnalisée */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 15s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default APropos;
