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
import { FiSearch } from "react-icons/fi"; // Installe react-icons si besoin
import Header from "./components/Header";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // style principal
import 'react-date-range/dist/theme/default.css'; // thème par défaut
import { fr } from 'date-fns/locale';

gsap.registerPlugin(ScrollTrigger);

function CreativeSearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <form
      onSubmit={onSubmit}
      className="relative w-full max-w-md mx-auto flex items-center group"
      style={{
        background: "linear-gradient(90deg, #f8fafc 60%, #e0f7fa 100%)",
        borderRadius: "2rem",
        boxShadow: "0 4px 24px 0 rgba(30, 180, 170, 0.10)",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full py-3 pl-5 pr-12 rounded-3xl bg-transparent text-[#222] placeholder-[#1BA3A9] font-medium outline-none border-2 border-transparent focus:border-[#1BA3A9] transition"
        style={{
          boxShadow: "none",
        }}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1BA3A9] hover:bg-[#148b8f] text-white p-2 rounded-full shadow transition"
        style={{
          boxShadow: "0 2px 8px 0 rgba(30, 180, 170, 0.15)",
        }}
        aria-label="Rechercher"
      >
        <FiSearch size={22} />
      </button>
    </form>
  );
}

// Ajouter un calendrier simple inline (pour la démo, tu pourras le remplacer par un vrai composant plus tard)
type SimpleDateRangePickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (start: string, end: string) => void;
  startDate: string | null;
  endDate: string | null;
};
function SimpleDateRangePicker({ open, onClose, onSelect, startDate, endDate }: SimpleDateRangePickerProps) {
  // Pour la démo, on utilise deux inputs type date
  return open ? (
    <div className="absolute z-50 bg-white p-4 rounded shadow border flex flex-col gap-2" style={{top: '60px', left: 0, minWidth: 250}}>
      <label className="text-sm text-gray-700">Début
        <input type="date" className="block border rounded p-1 mt-1" value={startDate || ''} onChange={e => onSelect(e.target.value, endDate || '')} />
      </label>
      <label className="text-sm text-gray-700">Fin
        <input type="date" className="block border rounded p-1 mt-1" value={endDate || ''} onChange={e => onSelect(startDate || '', e.target.value)} />
      </label>
      <button className="mt-2 px-3 py-1 bg-[#1BA3A9] text-white rounded" onClick={onClose}>OK</button>
    </div>
  ) : null;
}

export default function Home() {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  // 1. État initial
  const [selectedCategory, setSelectedCategory] = useState<'etablissement' | 'materiel' | 'service'>('etablissement');
  const [searchValue, setSearchValue] = useState("");
  const [userLocation, setUserLocation] = useState<string | null>(null);
  // Pour la gestion des étapes et focus
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'localisation' | 'date'>('type');
  const typeRef = useRef<HTMLSelectElement | null>(null);
  const locationRef = useRef<HTMLSelectElement | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement | null>(null);

  // 2. Placeholders pour chaque catégorie
  const placeholders = {
    etablissement: "Rechercher un établissement",
    materiel: "Rechercher un matériel",
    service: "Rechercher un service",
  };

  // 3. Dans l'input :
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

  // Redirection
  const redirectPaths: Record<string, string> = {
    etablissement: "/recherche/etablissement",
    materiel: "/recherche/materiel",
    service: "/recherche/service",
  };

  const handleCategorySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory && searchValue.trim()) {
      router.push(`${redirectPaths[selectedCategory]}?query=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleCategoryClick = (category: 'etablissement' | 'materiel' | 'service') => {
    setSelectedCategory(category);
  };

  // Ouvre automatiquement la localisation après type
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeout(() => {
      locationRef.current?.focus();
      locationRef.current?.click(); // tente d'ouvrir le select
    }, 100);
    setStep('localisation');
  };
  // Ouvre automatiquement le calendrier après localisation
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserLocation(e.target.value);
    setTimeout(() => {
      dateButtonRef.current?.focus();
      dateButtonRef.current?.click();
    }, 100);
    setStep('date');
  };
  // Affichage du texte du bouton date
  function getDateButtonText() {
    const start = range[0].startDate as Date | undefined;
    const end = range[0].endDate as Date | undefined;
    if (!start || !end) return 'Date';
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
  }

  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: null,
      key: 'selection'
    }
  ]);

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

  return (
    <div style={{ backgroundColor: '#FFF1E8' }}> {/* Couleur de fond globale */}
      {/* Header avec effet de scroll */}
      <Header />
      <>
        {/* Grand visuel émotionnel avec slogan */}
        <main className="relative min-h-screen flex items-start justify-center pt-32">
          {/* Image de fond assombrie */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: "url(/pexels-thevisionaryvows-32994494.jpg)",
              backgroundAttachment: "fixed",
              filter: "brightness(0.35)", // Plus sombre qu'avant
            }}
            aria-hidden="true"
          />
          {/* Contenu au-dessus */}
          <div className="relative z-10 text-center text-white px-6">
            {/* Pour le titre */}
            <motion.h1 className="font-bold text-[#F16462] text-[clamp(2rem,5vw,4rem)]">
              Planifiez l&apos;événement parfait
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="text-lg md:text-xl mt-4 text-white" // Changement de couleur en blanc
            >
         
            </motion.p>

            {/* Boutons de catégories */}
            <div className="max-w-[900px] w-full mx-auto flex flex-col items-center relative mt-6">
              {/* Barre de recherche */}
              <form className="w-full relative" onSubmit={(e) => {
                e.preventDefault();
                if (selectedCategory) {
                  router.push(redirectPaths[selectedCategory]);
                }
              }}>
                {/* Boutons flottants superposés */}
                <div className=" -top-7 left-0 w-full h-fit flex justify-start z-10">
                  <button
                    className={`px-8 py-1 rounded-xl rounded-b-none   border-2 border-b-0  border-[#17868a] text-base font-semibold shadow transition 
    ${selectedCategory === 'etablissement' ? 'bg-[#1BA3A9] text-white' : 'bg-white text-black'}
  `}
                    type="button"
                    onClick={() => handleCategoryClick('etablissement')}
                  >
                    Établissements
                  </button>
                  <button
                    className={`px-8 py-3 rounded-xl rounded-b-none border-2 border-b-0 border-[#17868a] text-base font-semibold shadow transition 
    ${selectedCategory === 'materiel' ? 'bg-[#1BA3A9] text-white' : 'bg-white text-black'}
  `}
                    type="button"
                    onClick={() => handleCategoryClick('materiel')}
                  >
                    Matériels
                  </button>
                  <button
                    className={`px-8 py-3 rounded-xl rounded-b-none border-2 border-b-0 border-[#17868a] text-base font-semibold shadow transition 
    ${selectedCategory === 'service' ? 'bg-[#1BA3A9] text-white' : 'bg-white text-black'}
  `}
                    type="button"
                    onClick={() => handleCategoryClick('service')}
                  >
                    Services
                  </button>
                </div>
                {/* Barre de recherche spécifique à chaque catégorie */}
                {selectedCategory === 'etablissement' && (
                  <div className="flex flex-col gap-0 w-full relative">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                      <select
                        ref={typeRef}
                        className="px-4 py-3 border border-gray-300 rounded-l rounded-r-none rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        onChange={handleTypeChange}
                        defaultValue=""
                      >
                        <option value="" disabled>Type d'établissement</option>
                        <option>Salle de réception</option>
                        <option>Villa</option>
                        <option>Hôtel</option>
                        <option>Ferme</option>
                      </select>
                      <select
                        ref={locationRef}
                        className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        value={userLocation || ""}
                        onChange={handleLocationChange}
                      >
                        <option value="">localisation</option>
                        <option value="Tunis">Tunis</option>
                        <option value="Ariana">Ariana</option>
                        <option value="Sousse">Sousse</option>
                        <option value="Hammamet">Hammamet</option>
                      </select>
                      {/* Bouton date custom */}
                      <div className="relative">
                        <button
                          ref={dateButtonRef}
                          type="button"
                          className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none bg-white text-black text-left w-full"
                          onClick={() => setDatePickerOpen(true)}
                        >
                          {getDateButtonText()}
                        </button>
                        {datePickerOpen && (
  <div className="absolute z-50 bg-white p-2 rounded shadow border" style={{top: '60px', left: '50%', transform: 'translateX(-50%)', width: 580, maxHeight: '350px', overflowY: 'auto'}}>
    <DateRange
      editableDateInputs={true}
      onChange={(item: any) => setRange([item.selection])}
      moveRangeOnFirstSelection={false}
      ranges={range}
      months={2}
      direction="horizontal"
      minDate={new Date()}
      rangeColors={["#1BA3A9"]}
      locale={fr}
    />
    {/* Boutons sous le calendrier */}
    <div className="flex gap-2 mt-2 justify-center">
      <button className="border px-2 py-1 rounded text-xs">Dates exactes</button>
      <button className="border px-2 py-1 rounded text-xs">± 1 jour</button>
      <button className="border px-2 py-1 rounded text-xs">± 2 jours</button>
    </div>
    <div className="flex justify-center mt-2">
      <button className="px-4 py-1 bg-[#1BA3A9] text-white rounded text-sm" onClick={() => setDatePickerOpen(false)}>OK</button>
    </div>
  </div>
)}
                      </div>
                      <button
                        type="submit"
                        className="bg-[#1BA3A9] text-white font-bold px-8 py-3 rounded-r-lg rounded-l-none border border-l border-gray-300 transition w-full h-full"
                        style={{ minWidth: '120px' }}
                      >
                        Rechercher
                      </button>
                    </div>
                  </div>
                )}
                {selectedCategory === 'materiel' && (
                  <div className="flex flex-col gap-0 w-full relative">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                      <select
                        ref={typeRef}
                        className="px-4 py-3 border border-gray-300 rounded-l rounded-r-none rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        onChange={handleTypeChange}
                        defaultValue=""
                      >
                        <option value="" disabled>Type de matériel</option>
                        <option>Sonorisation</option>
                        <option>Éclairage</option>
                        <option>Mobilier</option>
                        <option>Décoration</option>
                      </select>
                      <select
                        ref={locationRef}
                        className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        value={userLocation || ""}
                        onChange={handleLocationChange}
                      >
                        <option value="">localisation</option>
                        <option value="Tunis">Tunis</option>
                        <option value="Ariana">Ariana</option>
                        <option value="Sousse">Sousse</option>
                        <option value="Hammamet">Hammamet</option>
                      </select>
                      {/* Bouton date custom */}
                      <div className="relative">
                        <button
                          ref={dateButtonRef}
                          type="button"
                          className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none bg-white text-black text-left w-full"
                          onClick={() => setDatePickerOpen(true)}
                        >
                          {getDateButtonText()}
                        </button>
                        {datePickerOpen && (
  <div className="absolute z-50 bg-white p-2 rounded shadow border" style={{top: '60px', left: '50%', transform: 'translateX(-50%)', width: 580, maxHeight: '350px', overflowY: 'auto'}}>
    <DateRange
      editableDateInputs={true}
      onChange={(item: any) => setRange([item.selection])}
      moveRangeOnFirstSelection={false}
      ranges={range}
      months={2}
      direction="horizontal"
      minDate={new Date()}
      rangeColors={["#1BA3A9"]}
      locale={fr}
    />
    {/* Boutons sous le calendrier */}
    <div className="flex gap-2 mt-2 justify-center">
      <button className="border px-2 py-1 rounded text-xs">Dates exactes</button>
      <button className="border px-2 py-1 rounded text-xs">± 1 jour</button>
      <button className="border px-2 py-1 rounded text-xs">± 2 jours</button>
    </div>
    <div className="flex justify-center mt-2">
      <button className="px-4 py-1 bg-[#1BA3A9] text-white rounded text-sm" onClick={() => setDatePickerOpen(false)}>OK</button>
    </div>
  </div>
)}
                      </div>
                      <button
                        type="submit"
                        className="bg-[#1BA3A9] text-white font-bold px-8 py-3 rounded-r-lg rounded-l-none border border-l border-gray-300 transition w-full h-full"
                        style={{ minWidth: '120px' }}
                      >
                        Rechercher
                      </button>
                    </div>
                  </div>
                )}
                {selectedCategory === 'service' && (
                  <div className="flex flex-col gap-0 w-full relative">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                      <select
                        ref={typeRef}
                        className="px-4 py-3 border border-gray-300 rounded-l rounded-r-none rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        onChange={handleTypeChange}
                        defaultValue=""
                      >
                        <option value="" disabled>Type de service</option>
                        <option>Photographe</option>
                        <option>Traiteur</option>
                        <option>Animation</option>
                        <option>Transport</option>
                      </select>
                      <select
                        ref={locationRef}
                        className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none focus:ring-2 focus:ring-[#F16462] text-black bg-white"
                        value={userLocation || ""}
                        onChange={handleLocationChange}
                      >
                        <option value="">localisation</option>
                        <option value="Tunis">Tunis</option>
                        <option value="Ariana">Ariana</option>
                        <option value="Sousse">Sousse</option>
                        <option value="Hammamet">Hammamet</option>
                      </select>
                      {/* Bouton date custom */}
                      <div className="relative">
                        <button
                          ref={dateButtonRef}
                          type="button"
                          className="px-4 py-3 border-t border-b border-l border-gray-300 rounded-none bg-white text-black text-left w-full"
                          onClick={() => setDatePickerOpen(true)}
                        >
                          {getDateButtonText()}
                        </button>
                        {datePickerOpen && (
  <div className="absolute z-50 bg-white p-2 rounded shadow border" style={{top: '60px', left: '50%', transform: 'translateX(-50%)', width: 580, maxHeight: '350px', overflowY: 'auto'}}>
    <DateRange
      editableDateInputs={true}
      onChange={(item: any) => setRange([item.selection])}
      moveRangeOnFirstSelection={false}
      ranges={range}
      months={2}
      direction="horizontal"
      minDate={new Date()}
      rangeColors={["#1BA3A9"]}
      locale={fr}
    />
    {/* Boutons sous le calendrier */}
    <div className="flex gap-2 mt-2 justify-center">
      <button className="border px-2 py-1 rounded text-xs">Dates exactes</button>
      <button className="border px-2 py-1 rounded text-xs">± 1 jour</button>
      <button className="border px-2 py-1 rounded text-xs">± 2 jours</button>
    </div>
    <div className="flex justify-center mt-2">
      <button className="px-4 py-1 bg-[#1BA3A9] text-white rounded text-sm" onClick={() => setDatePickerOpen(false)}>OK</button>
    </div>
  </div>
)}
                      </div>
                      <button
                        type="submit"
                        className="bg-[#1BA3A9] text-white font-bold px-8 py-3 rounded-r-lg rounded-l-none border border-l border-gray-300 transition w-full h-full"
                        style={{ minWidth: '120px' }}
                      >
                        Rechercher
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>

        {/* Suggestions de lieux populaires avec effet Tilt (toujours affichées) */}
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
