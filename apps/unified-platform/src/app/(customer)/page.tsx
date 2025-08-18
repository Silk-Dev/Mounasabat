'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import Header from "@/components/old-marketing/Header";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { fr } from 'date-fns/locale';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

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
        className="w-full py-3 pl-5 pr-12 rounded-3xl bg-transparent text-[#222] placeholder-[#F16462] font-medium outline-none border-2 border-transparent focus:border-[#F16462] transition"
        style={{
          boxShadow: "none",
        }}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F16462] hover:bg-[#e04e4c] text-white p-2 rounded-full shadow transition"
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

type SimpleDateRangePickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (start: string, end: string) => void;
  startDate: string | null;
  endDate: string | null;
};
function SimpleDateRangePicker({ open, onClose, onSelect, startDate, endDate }: SimpleDateRangePickerProps) {
  const [mood, setMood] = useState('elegant');

  return open ? (
    <div className="absolute z-50 bg-white p-4 rounded shadow border flex flex-col gap-2" style={{ top: '60px', left: 0, minWidth: 250 }}>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'etablissement' | 'materiel' | 'service'>('etablissement');
  const [step, setStep] = useState<'type' | 'localisation' | 'date'>('type');
  const [searchValue, setSearchValue] = useState("");
  const [mood, setMood] = useState('elegant');
  const moods = [
    { id: 'elegant', name: 'Élégant', emoji: '✨', image: '/Ambiance élégant.jpg' },
    { id: 'modern', name: 'Moderne', emoji: '🖥️', image: '/Ambiance moderne.jpg' },
    { id: 'vintage', name: 'Vintage', emoji: '📷', image: '/Ambiance vintage.jpg' },
    { id: 'natural', name: 'Naturel', emoji: '🌿', image: '/Ambiance naturel.jpg' },
  ];
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [endDate, setEndDate] = useState<string>('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const typeRef = useRef<HTMLSelectElement | null>(null);
  const locationRef = useRef<HTMLSelectElement | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement | null>(null);

  const placeholders = {
    etablissement: "Rechercher un établissement",
    materiel: "Rechercher un matériel",
    service: "Rechercher un service",
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Rediriger vers la page de la catégorie sélectionnée
    if (selectedCategory) {
      router.push(`/recherche/${selectedCategory}`);
    } else {
      // Par défaut, rediriger vers la page des établissements
      router.push('/recherche/etablissement');
    }
  };

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
    // On ne redirige plus ici, on attend le clic sur le bouton Rechercher
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeout(() => {
      locationRef.current?.focus();
      locationRef.current?.click();
    }, 100);
    setStep('localisation');
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserLocation(e.target.value);
    setTimeout(() => {
      dateButtonRef.current?.focus();
      dateButtonRef.current?.click();
    }, 100);
    setStep('date');
  };

  const getDateButtonText = () => {
    const start = range[0].startDate as Date | undefined;
    const end = range[0].endDate as Date | undefined;
    if (!start || !end) return 'Date';
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
  };

  const [range, setRange] = useState<Array<{ startDate: Date | null; endDate: Date | null; key: string }>>([
    {
      startDate: null,
      endDate: null,
      key: 'selection'
    }
  ]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = document.getElementById('background-video') as HTMLVideoElement;
    if (!video) return;

    const handleVideoPlay = () => setIsVideoPlaying(true);
    const handleVideoPause = () => setIsVideoPlaying(false);

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);

    // Démarrer la lecture de la vidéo
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Autoplay prevented:", error);
        video.muted = true;
        video.play().catch(e => console.log("Muted autoplay also prevented", e));
      });
    }

    // Observer pour détecter quand la section héro n'est plus visible
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (video) {
          if (entry.isIntersecting) {
            video.play().catch(e => console.log("Play failed:", e));
          } else {
            video.pause();
          }
        }
      },
      {
        root: null,
        threshold: 0.1
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = document.getElementById('background-video') as HTMLVideoElement;
    if (video) {
      video.play().catch(error => {
        console.log("Autoplay prevented:", error);
        video.muted = true;
        video.play().catch(e => console.log("Muted autoplay also prevented", e));
      });
    }
  }, []);

  return (
    <div style={{ overflow: 'hidden' }}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          id="background-video"
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src="/14178958_1920_1080_25fps.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <Header />

      <main ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="relative z-10 text-center text-white w-full max-w-6xl mx-auto">
          <motion.h1 className="font-medium text-[#F16462] text-[clamp(1.5rem,5vw,3.6rem)] leading-tight mb-4 whitespace-normal sm:whitespace-nowrap">
            Planifiez votre événement{' '}
            <span className="block sm:inline">en toute sérénité</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-lg md:text-xl mt-4 text-white"
          >
            Trouvez les meilleurs prestataires pour vos événements en quelques clics
          </motion.p>

          <div className="w-full flex flex-col items-center relative mt-8 sm:mt-12 bg-white/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white/30 mx-2 sm:mx-4">
            <form className="w-full relative" onSubmit={handleSearch}>
              <div className="-top-6 sm:-top-7 left-0 w-full h-fit flex flex-wrap justify-start z-10 gap-1 sm:gap-0">
                <button
                  className={`px-3 sm:px-6 py-1 sm:py-1.5 rounded-lg sm:rounded-xl rounded-b-none border-2 border-b-0 border-[#17868a] text-xs sm:text-sm md:text-[15px] font-medium shadow transition-all duration-200 ${selectedCategory === 'etablissement' ? 'bg-[#F16462] text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                  type="button"
                  onClick={() => handleCategoryClick('etablissement')}
                >
                  Établissements
                </button>
                <button
                  className={`px-3 sm:px-6 py-1 sm:py-1.5 rounded-lg sm:rounded-xl rounded-b-none border-2 border-b-0 border-[#17868a] text-xs sm:text-sm md:text-[15px] font-medium shadow transition-all duration-200 ${selectedCategory === 'materiel' ? 'bg-[#F16462] text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                  type="button"
                  onClick={() => handleCategoryClick('materiel')}
                >
                  Matériels
                </button>
                <button
                  className={`px-3 sm:px-6 py-1 sm:py-1.5 rounded-lg sm:rounded-xl rounded-b-none border-2 border-b-0 border-[#17868a] text-xs sm:text-sm md:text-[15px] font-medium shadow transition-all duration-200 ${selectedCategory === 'service' ? 'bg-[#F16462] text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                  type="button"
                  onClick={() => handleCategoryClick('service')}
                >
                  Services
                </button>
              </div>

              {selectedCategory === 'etablissement' && (
                <div className="flex flex-col gap-0 w-full relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-0">
                    <select
                      ref={typeRef}
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded sm:rounded-l sm:rounded-r-none sm:rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
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
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-r-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
                      value={userLocation || ""}
                      onChange={handleLocationChange}
                    >
                      <option value="">localisation</option>
                      <option value="Tunis">Tunis</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Hammamet">Hammamet</option>
                    </select>
                    <div className="relative">
                      <button
                        ref={dateButtonRef}
                        type="button"
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-none bg-white text-sm sm:text-base text-black text-left w-full"
                        onClick={() => setDatePickerOpen(true)}
                      >
                        {getDateButtonText()}
                      </button>
                      {datePickerOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:bg-transparent sm:absolute sm:inset-auto sm:p-2 sm:top-16 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:bg-white sm:rounded sm:shadow-lg sm:border" style={{ maxWidth: '95vw', maxHeight: '90vh' }}>
                          <div className="w-full max-w-full overflow-auto bg-white rounded sm:shadow-none">
                            <DateRange
                              editableDateInputs={true}
                              onChange={(item: any) => setRange([item.selection])}
                              moveRangeOnFirstSelection={false}
                              ranges={range}
                              months={window.innerWidth < 640 ? 1 : 2}
                              direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
                              minDate={new Date()}
                              rangeColors={["#F16462"]}
                              locale={fr}
                            />
                            <div className="flex flex-wrap gap-2 p-2 justify-center">
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">Dates exactes</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 1 jour</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 2 jours</button>
                            </div>
                            <div className="flex justify-center p-2 border-t">
                              <button 
                                className="px-6 py-2 bg-[#F16462] hover:bg-[#e04e4c] text-white rounded text-sm font-medium w-full max-w-xs" 
                                onClick={() => setDatePickerOpen(false)}
                              >
                                Valider les dates
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="bg-[#F16462] hover:bg-[#e04e4c] text-white font-medium px-4 sm:px-6 py-2 sm:py-2.5 rounded sm:rounded-r-lg sm:rounded-l-none border border-t-0 sm:border-l border-gray-300 transition w-full h-full text-sm sm:text-[15px] tracking-wide"
                      style={{ minWidth: '120px' }}
                    >
                      Rechercher
                    </button>
                  </div>
                </div>
              )}
              {selectedCategory === 'materiel' && (
                <div className="flex flex-col gap-0 w-full relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-0">
                    <select
                      ref={typeRef}
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded sm:rounded-l sm:rounded-r-none sm:rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
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
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-r-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
                      value={userLocation || ""}
                      onChange={handleLocationChange}
                    >
                      <option value="">localisation</option>
                      <option value="Tunis">Tunis</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Hammamet">Hammamet</option>
                    </select>
                    <div className="relative">
                      <button
                        ref={dateButtonRef}
                        type="button"
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-none bg-white text-sm sm:text-base text-black text-left w-full"
                        onClick={() => setDatePickerOpen(true)}
                      >
                        {getDateButtonText()}
                      </button>
                      {datePickerOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:bg-transparent sm:absolute sm:inset-auto sm:p-2 sm:top-16 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:bg-white sm:rounded sm:shadow-lg sm:border" style={{ maxWidth: '95vw', maxHeight: '90vh' }}>
                          <div className="w-full max-w-full overflow-auto bg-white rounded sm:shadow-none">
                            <DateRange
                              editableDateInputs={true}
                              onChange={(item: any) => setRange([item.selection])}
                              moveRangeOnFirstSelection={false}
                              ranges={range}
                              months={window.innerWidth < 640 ? 1 : 2}
                              direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
                              minDate={new Date()}
                              rangeColors={["#F16462"]}
                              locale={fr}
                            />
                            <div className="flex flex-wrap gap-2 p-2 justify-center">
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">Dates exactes</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 1 jour</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 2 jours</button>
                            </div>
                            <div className="flex justify-center p-2 border-t">
                              <button 
                                className="px-6 py-2 bg-[#F16462] hover:bg-[#e04e4c] text-white rounded text-sm font-medium w-full max-w-xs" 
                                onClick={() => setDatePickerOpen(false)}
                              >
                                Valider les dates
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="bg-[#F16462] hover:bg-[#e04e4c] text-white font-medium px-4 sm:px-6 py-2 sm:py-2.5 rounded sm:rounded-r-lg sm:rounded-l-none border border-t-0 sm:border-l border-gray-300 transition w-full h-full text-sm sm:text-[15px] tracking-wide"
                      style={{ minWidth: '120px' }}
                    >
                      Rechercher
                    </button>
                  </div>
                </div>
              )}
              {selectedCategory === 'service' && (
                <div className="flex flex-col gap-0 w-full relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-0">
                    <select
                      ref={typeRef}
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded sm:rounded-l sm:rounded-r-none sm:rounded-tl-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
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
                      className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-r-none focus:ring-2 focus:ring-[#F16462] text-sm sm:text-base text-black bg-white w-full"
                      value={userLocation || ""}
                      onChange={handleLocationChange}
                    >
                      <option value="">localisation</option>
                      <option value="Tunis">Tunis</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Hammamet">Hammamet</option>
                    </select>
                    <div className="relative">
                      <button
                        ref={dateButtonRef}
                        type="button"
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-l-0 border-gray-300 rounded-none bg-white text-sm sm:text-base text-black text-left w-full"
                        onClick={() => setDatePickerOpen(true)}
                      >
                        {getDateButtonText()}
                      </button>
                      {datePickerOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:bg-transparent sm:absolute sm:inset-auto sm:p-2 sm:top-16 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:bg-white sm:rounded sm:shadow-lg sm:border" style={{ maxWidth: '95vw', maxHeight: '90vh' }}>
                          <div className="w-full max-w-full overflow-auto bg-white rounded sm:shadow-none">
                            <DateRange
                              editableDateInputs={true}
                              onChange={(item: any) => setRange([item.selection])}
                              moveRangeOnFirstSelection={false}
                              ranges={range}
                              months={window.innerWidth < 640 ? 1 : 2}
                              direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
                              minDate={new Date()}
                              rangeColors={["#F16462"]}
                              locale={fr}
                            />
                            <div className="flex flex-wrap gap-2 p-2 justify-center">
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">Dates exactes</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 1 jour</button>
                              <button className="border px-3 py-1.5 rounded text-sm sm:text-xs">± 2 jours</button>
                            </div>
                            <div className="flex justify-center p-2 border-t">
                              <button 
                                className="px-6 py-2 bg-[#F16462] hover:bg-[#e04e4c] text-white rounded text-sm font-medium w-full max-w-xs" 
                                onClick={() => setDatePickerOpen(false)}
                              >
                                Valider les dates
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="bg-[#F16462] hover:bg-[#e04e4c] text-white font-medium px-4 sm:px-6 py-2 sm:py-2.5 rounded sm:rounded-r-lg sm:rounded-l-none border border-t-0 sm:border-l border-gray-300 transition w-full h-full text-sm sm:text-[15px] tracking-wide"
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

          <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mt-32">
            <div className="w-screen">
              <section className="py-16 w-full relative overflow-hidden">
                {/* Fond avec dégradé et effets */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1BA3A9] via-[#e67e7d] to-[#F16462] z-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#F1646210_0%,transparent_60%)] animate-pulse"></div>
                  <div className="absolute -bottom-1/2 -left-1/2 w-full h-[200%] bg-[#F16462] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                  <div className="absolute -top-1/2 -right-1/2 w-full h-[200%] bg-[#1BA3A9] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>
                
                <div className="w-full text-center relative z-10">
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    {/* Texte à gauche */}
                    <div className="w-full lg:w-1/2 space-y-6">
                      <div className="inline-block px-6 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                        Monasabet 
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white">
                        L'excellence événementielle <span className="text-white font-extrabold drop-shadow-md">à votre portée</span>
                      </h2>
                      <p className="text-lg text-white/90">
                        Trouvez et réservez les meilleurs prestataires pour votre événement en quelques clics. Lieux d'exception, traiteurs étoilés, photographes talentueux et équipements haut de gamme réunis sur une plateforme intuitive.
                      </p>
                    </div>

                    {/* Images à droite */}
                    <div className="w-full lg:w-1/2">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { 
                            src: "/Bohème & Coloré.jpg",
                            title: "Mariages",
                            description: "Des moments uniques"
                          },
                          { 
                            src: "/Conférence professionnelle.jpg",
                            title: "Entreprises",
                            description: "Professionnalisme"
                          },
                          { 
                            src: "/Mariage élégant.jpg",
                            title: "Soirées",
                            description: "Ambiance magique"
                          }
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ 
                              opacity: 1, 
                              y: 0,
                              transition: { 
                                duration: 0.5,
                                delay: index * 0.1
                              }
                            }}
                            viewport={{ once: true, margin: "-50px" }}
                            whileHover={{ 
                              y: -5,
                              transition: { duration: 0.2 }
                            }}
                            className="group relative overflow-hidden rounded-xl aspect-[3/4] bg-gray-100/10 backdrop-blur-sm border border-white/10"
                          >
                            <Image 
                              src={item.src} 
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                              <p className="text-white/80 text-xs">{item.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-center mb-12 text-gray-800"
              >
                Pour qui cette plateforme ?
              </motion.h2>
              <div className="grid md:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="relative p-8 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F16462]/10 via-[#F16462]/5 to-white/50 -z-10"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#F16462] rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#F16462] rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
                  <div className="text-4xl mb-4"></div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">Pour les clients</h3>
                  <ul className="space-y-3">
                    {[
                      'Comparez et réservez les prestataires facilement',
                      'Inspirez-vous avec notre galerie d\'idées',
                      'Suivez et gérez toutes vos réservations au même endroit'
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.3 + (index * 0.1) }}
                        className="flex items-start"
                      >
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-800">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="relative p-8 rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F16462]/10 via-[#F16462]/5 to-white/50 -z-10"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#F16462] rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#F16462] rounded-full mix-blend-multiply filter blur-xl opacity-10"></div>
                  <div className="text-4xl mb-4"></div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">Pour les prestataires</h3>
                  <ul className="space-y-3">
                    {[
                      'Recevez des demandes de vrais clients',
                      'Gérez votre profil gratuitement',
                      'Gagnez en visibilité et en notoriété'
                    ].map((item, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.5 + (index * 0.1) }}
                        className="flex items-start"
                      >
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-800">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Comment ça marche ?</h2>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-12 text-2xl font-semibold text-gray-700">
               
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">1. Recherchez</h3>
                  <p className="text-gray-600">Trouvez les prestataires qui correspondent à vos critères</p>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-4">⚖️</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">2. Comparez</h3>
                  <p className="text-gray-600">Consultez les profils, tarifs et avis des prestataires</p>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">3. Réservez</h3>
                  <p className="text-gray-600">Finalisez votre réservation en quelques clics</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Nos catégories de services</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {[
                  {
                    title: 'Lieux de mariage',
                    desc: 'Salles de réception, châteaux, jardins...',
                    icon: '',
                    image: '/lieu de mariage.jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  },
                  {
                    title: 'Photographes',
                    desc: 'Professionnels de la photo et vidéo',
                   
                    image: '/Photographes.jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  },
                  {
                    title: 'Traiteurs',
                    desc: 'Services de restauration et pâtisserie',
                 
                    image: '/Traiteurs.jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  },
                  {
                    title: 'Matériel',
                    desc: 'Mobilier, décoration, sonorisation',
                 
                    image: '/event equipment.jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  },
                  {
                    title: 'DJ & Musiciens',
                    desc: 'Animation musicale pour votre événement',
                
                    image: '/DJ & Musiciens.jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  },
                  {
                    title: 'Fleurs & Décoration',
                    desc: 'Compositions florales et ornements',
                 
                    image: '/floral decorations .jpg',
                    gradient: 'from-black/60 to-black/20',
                    textColor: 'text-white'
                  }
                ].map((category, index) => (
                  <motion.div
                    key={index}
                    className="relative rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all group h-full flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="absolute inset-0">
                      <Image
                        src={category.image}
                        alt={category.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-b ${category.gradient}`}></div>
                    </div>
                    <div className="relative p-6 flex-1 flex flex-col">
                      <div className="flex-1">
                        <div className={`text-5xl mb-4 ${category.textColor} drop-shadow-lg`}>{category.icon}</div>
                        <h3 className={`text-2xl font-bold mb-2 ${category.textColor} drop-shadow-lg`}>{category.title}</h3>
                        <p className={`${category.textColor} text-opacity-90 drop-shadow`}>{category.desc}</p>
                      </div>
                      <button className="mt-4 text-sm font-medium bg-white/90 hover:bg-white text-gray-800 py-2 px-4 rounded-full inline-flex items-center self-start transition-colors">
                        Voir les prestataires
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white -z-10"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                <motion.h2 
                  className="text-4xl font-bold text-gray-800 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Ambiances et inspirations
                </motion.h2>
                <motion.p 
                  className="text-xl text-gray-600 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Découvrez différentes ambiances pour vous inspirer et trouver le style parfait pour votre événement.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Élégant & Raffiné ',
                    tag: 'elegant',
                    image: '/Mariage élégant.jpg',
                    count: '24 prestataires',
                    gradient: 'from-black/60 to-transparent'
                  },
                  {
                    title: 'Moderne & Épuré',
                    tag: 'modern',
                    image: '/Ambiance moderne.jpg',
                    count: '18 prestataires',
                    gradient: 'from-blue-900/70 to-transparent'
                  },
                  {
                    title: 'Vintage & Rétro',
                    tag: 'vintage',
                    image: '/Ambiance vintage.jpg',
                    count: '15 prestataires',
                    gradient: 'from-amber-900/70 to-transparent'
                  },
                  {
                    title: 'Nature & Champêtre',
                    tag: 'nature',
                    image: '/Ambiance naturel.jpg',
                    count: '22 prestataires',
                    gradient: 'from-emerald-900/70 to-transparent'
                  },
                  {
                    title: 'Bohème & Coloré',
                    tag: 'boho',
                    image: '/Bohème & Coloré.jpg',
                    count: '16 prestataires',
                    gradient: 'from-purple-900/70 to-transparent'
                  },
                  {
                    title: 'Luxe & Prestige',
                    tag: 'luxury',
                    image: '/beautiful-luxurious-wedding-ceremony-hall.jpg',
                    count: '12 prestataires',
                    gradient: 'from-rose-900/70 to-transparent'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl h-96 shadow-xl hover:shadow-2xl transition-all duration-500"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ 
                      duration: 0.6,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-full overflow-hidden">
                        <div className="relative w-full h-full transform transition-transform duration-700 group-hover:scale-110">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} via-black/30`}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                        <h3 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">{item.title}</h3>
                        <p className="text-gray-200 mb-4 text-sm lg:text-base">{item.count} disponibles</p>
                      </div>
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button className="inline-flex items-center px-6 py-2.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white hover:bg-white/30 border border-white/20 transition-colors">
                          Voir les prestataires
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/40 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                        #{item.tag}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="text-center mt-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-[#F16462] to-[#1BA3A9] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F16462] transition-all transform hover:scale-105">
                  Explorer toutes les ambiances
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Notre impact</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                  Rejoignez des milliers d'organisateurs qui nous font confiance
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
                <div className="text-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-[#F16462] mb-1 sm:mb-2">500+</div>
                  <p className="text-sm sm:text-base text-gray-600">Événements organisés</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-[#F16462] mb-1 sm:mb-2">300+</div>
                  <p className="text-sm sm:text-base text-gray-600">Prestataires disponibles</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                  <div className="text-3xl sm:text-4xl font-bold text-[#F16462] mb-1 sm:mb-2">98%</div>
                  <p className="text-sm sm:text-base text-gray-600">Clients satisfaits</p>
                </div>
              </div>

              <div className="max-w-4xl mx-auto bg-white/90 sm:bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg relative z-10 border border-gray-100 sm:border-white/30">
                <div className="text-4xl sm:text-5xl text-gray-200 absolute -top-5 sm:-top-6 left-6 sm:left-8">"</div>
                <p className="text-lg sm:text-xl text-gray-700 sm:text-gray-700 italic mb-6 sm:mb-8 relative z-10">
                  Notre mariage a été un véritable conte de fées grâce à cette plateforme. Nous avons trouvé tous nos prestataires au même endroit et l'organisation a été simplifiée à l'extrême !
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F16462] to-[#1BA3A9] flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 sm:mr-4">
                      M
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-gray-800">Marie & Thomas</div>
                      <div className="text-xs sm:text-sm text-gray-500">Mariés en Juin 2023</div>
                    </div>
                  </div>
                  <div className="flex space-x-0.5 sm:space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Prêt à organiser votre événement ?</h2>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers d'organisateurs qui nous font confiance pour rendre leur événement inoubliable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 sm:px-8 py-3 bg-gradient-to-r from-[#F16462] to-[#1BA3A9] hover:opacity-90 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-300 transform hover:scale-105">
                  Commencer maintenant
                </button>
                <button className="px-6 sm:px-8 py-3 border border-gray-300 hover:border-[#F16462] text-gray-700 hover:text-[#F16462] font-medium rounded-lg text-sm sm:text-base transition-all duration-300">
                  En savoir plus
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="relative bg-gradient-to-r from-[#F16462] to-[#1BA3A9] pt-20 pb-24">
        <div className="container mx-auto px-4 text-center text-white relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Prêt(e) à commencer ?</h2>
            <p className="text-xl md:text-2xl opacity-90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Rejoignez notre communauté et donnez vie à votre événement de rêve
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              className="bg-white text-[#F16462] hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-base md:text-lg transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Je cherche un prestataire
            </button>
            <button
              className="bg-transparent border-2 border-white hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full text-base md:text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
              onClick={() => {}}
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Je suis prestataire
            </button>
          </motion.div>


        </div>
      </section>


    </div>
  );
}
