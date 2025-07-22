"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Tilt } from "react-tilt"; // Pour l'effet de carte 3D
import { Swiper, SwiperSlide } from "swiper/react"; // Pour la galerie 3D
import "swiper/css"; // Styles nécessaires pour Swiper
import "swiper/css/effect-cube";
import EffectCube from "swiper";
import { useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<null | 'etablissement' | 'materiel' | 'service'>(null);

  useEffect(() => {
    if (backgroundRef.current) {
      gsap.to(backgroundRef.current, {
        yPercent: -20,
        ease: "power1.out",
        scrollTrigger: {
          trigger: backgroundRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target;
    const type = form[0].value;
    const ville = form[1].value;
    const date = form[2].value;
    // Ajoute ici le champ de recherche texte si besoin
    //router.push(`/recherche?type=${type}&ville=${ville}&date=${date}`);
    router.push(`/recherche/eventype/${type}?ville=${ville}&date=${date}`);
  };

  return (
    <div style={{ backgroundColor: '#FFF1E8' }}> {/* Couleur de fond globale */}
      <>
        {/* Grand visuel émotionnel avec slogan */}
        <main
          className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
          style={{
            backgroundImage: 'url(/pexels-thevisionaryvows-32994494.jpg)',
            backgroundAttachment: 'fixed',
            backgroundColor: '#FFF1E8',
          }}
          ref={scrollContainerRef}
        >
          <div
            ref={backgroundRef}
            className="absolute inset-0 bg-black/70"
          ></div>
          <div className="relative z-10 text-center text-[#3A3A3A] px-6">
            <motion.h1
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="font-bold text-[#F16462] text-[clamp(2rem,5vw,4rem)]"
            >
              Planifiez l&apos;événement parfait
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="text-lg md:text-xl mt-4 text-white" // Changement de couleur en blanc
            >
         
            </motion.p>

            {/* Barre de sélection catégorie à la place de la barre de recherche */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className={`bg-white hover:bg-[#1BA3A9]/10 focus:ring-4 focus:outline-none focus:ring-[#1BA3A9]/30 font-medium rounded-full text-base px-8 py-3 text-center inline-flex items-center mx-2 mb-2 border-2 border-[#1BA3A9] transition`} style={{ color: '#1BA3A9' }}
                onClick={() => {
                  setSelectedCategory('etablissement');
                  router.push('/recherche/etablissement');
                }}
              >
                <span className="text-xl mr-2"></span> Établissements
              </button>
              <button
                type="button"
                className={`bg-white hover:bg-[#1BA3A9]/10 focus:ring-4 focus:outline-none focus:ring-[#1BA3A9]/30 font-medium rounded-full text-base px-8 py-3 text-center inline-flex items-center mx-2 mb-2 border-2 border-[#1BA3A9] transition`} style={{ color: '#1BA3A9' }}
                onClick={() => {
                  setSelectedCategory('produit');
                  router.push('/recherche/materiel');
                }}
              >
                <span className="text-xl mr-2"></span> Matériels
              </button>
              <button
                type="button"
                className={`bg-white hover:bg-[#1BA3A9]/10 focus:ring-4 focus:outline-none focus:ring-[#1BA3A9]/30 font-medium rounded-full text-base px-8 py-3 text-center inline-flex items-center mx-2 mb-2 border-2 border-[#1BA3A9] transition`} style={{ color: '#1BA3A9' }}
                onClick={() => {
                  setSelectedCategory('service');
                  router.push('/recherche/service');
                }}
              >
                <span className="text-xl mr-2"></span> Services
              </button>
            </div>
          </div>
        </main>

        {/* Suggestions de lieux populaires avec effet Tilt */}
        <section className="bg-[#FFF6F6] py-16">
          <div className="max-w-6xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-4xl font-bold text-center text-[#3A3A3A] mb-8"
            >
              Trouvez tous les prestataires dont vous avez besoin
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="text-center text-lg text-[#3A3A3A] mb-12"
            >
              Connectez-vous avec des professionnels expérimentés pour rendre votre journée inoubliable.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
              {/* Wedding Venues */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform"
              >
                <Image
                  src="/venue.jpg"
                  alt="Lieux de mariage"
                  width={200}
                  height={300}
                  className="w-full h-56 object-cover"
                />
                <div className="p-6 text-center">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-xl font-bold text-[#F16462] mb-2"
                  >
                    Lieux
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="text-[#3A3A3A]"
                  >
                    Explorez et visitez des lieux de réception pour célébrer votre amour.
                  </motion.p>
                </div>
              </motion.div>

              {/* Wedding Photographers */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform"
              >
                <Image
                  src="/photographer.jpg"
                  alt="Photographes de mariage"
                  width={500}
                  height={300}
                  className="w-full h-56 object-cover"
                />
                <div className="p-6 text-center">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-xl font-bold text-[#F16462] mb-2"
                  >
                    Photographes
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="text-[#3A3A3A]"
                  >
                    Trouvez des photographes locaux pour capturer l'essence de votre journée.
                  </motion.p>
                </div>
              </motion.div>

              {/* Wedding Caterers */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform"
              >
                <Image
                  src="/food.jpg"
                  alt="Traiteurs de mariage"
                  width={500}
                  height={300}
                  className="w-full h-56 object-cover"
                />
                <div className="p-6 text-center">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-xl font-bold text-[#F16462] mb-2"
                  >
                    Traiteurs
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="text-[#3A3A3A]"
                  >
                    Découvrez des chefs et barmans pour créer un menu inoubliable.
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </>
    </div>
  );
}
