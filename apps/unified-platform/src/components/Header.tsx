'use client';

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  ChevronDownIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const pathname = usePathname();
  const isAboutPage = pathname === "/a-propos";
  const isSearchPage = [
    '/recherche/etablissement',
    '/recherche/materiel',
    '/recherche/service'
  ].some(route => pathname.startsWith(route));

  const [scrolled, setScrolled] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchCategory, setSearchCategory] = useState('etablissement');
  const searchRef = useRef<HTMLDivElement>(null);
  const { session, signOut } = useAuth();
  // Toggle dropdown menu
  const toggleEventMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEventMenu(!showEventMenu);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuElement = document.querySelector('.event-menu-dropdown');
      const buttonElement = document.querySelector('.event-menu-button');
      
      if (menuElement && 
          buttonElement && 
          !menuElement.contains(target) && 
          !buttonElement.contains(target)) {
        setShowEventMenu(false);
      }
    };

    if (showEventMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEventMenu]);

  // Handle scroll with throttling for better performance
  useEffect(() => {
    // Vérifier si on est côté client avant d'accéder à window
    if (typeof window === 'undefined') return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrolled = () => {
      const currentScrollY = window.scrollY;
      // Update state only if crossing the threshold
      if ((currentScrollY > 10) !== scrolled) {
        setScrolled(currentScrollY > 10);
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrolled);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300bg-white/30 backdrop-blur-sm shadow-sm text-[#222]" 
      `}
    >
      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Image src="/logoo.png" alt="Monasabet Logo" width={140} height={140} />

        <ul className={`
          flex gap-8 text-base font-semibold transition-colors duration-300`}>
          <li className="relative">
            <button 
              onClick={toggleEventMenu}
              className="event-menu-button hover:text-[#1CCFC9] transition flex items-center bg-transparent border-none cursor-pointer text-current"
            >
              Organiser un événement <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button> 
            <div 
              className={`event-menu-dropdown absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md transition-all duration-200 ${
                showEventMenu ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            >
              <a href="/lieux" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white" onClick={() => setShowEventMenu(false)}>Lieux de réception</a>
              <a href="/prestataires" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white" onClick={() => setShowEventMenu(false)}>Prestataires de services</a>
              <a href="/idees-conseils" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white" onClick={() => setShowEventMenu(false)}>Idées & Conseils</a>
            </div>
          </li>
          <li><a href="/a-propos" className="hover:text-[#1CCFC9] transition">À propos</a></li>
          <li><a href="/contact" className="hover:text-[#1CCFC9] transition">Contact</a></li>
          <li className="relative group">
            <a href="#" className="hover:text-[#1CCFC9] transition flex items-center">
              Recherche avancée <ChevronDownIcon className="w-4 h-4 ml-1" />
            </a>
            
            {/* Menu déroulant simple avec catégories */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link 
                href="/recherche/etablissement" 
                className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-700"
              >
                <BuildingOfficeIcon className="w-5 h-5 mr-3 text-gray-400" />
                Établissements
              </Link>
              <Link 
                href="/recherche/materiel" 
                className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-700"
              >
                <WrenchScrewdriverIcon className="w-5 h-5 mr-3 text-gray-400" />
                Matériels
              </Link>
              <Link 
                href="/recherche/service" 
                className="flex items-center px-4 py-3 hover:bg-gray-50 text-gray-700"
              >
                <UserGroupIcon className="w-5 h-5 mr-3 text-gray-400" />
                Services
              </Link>
            </div>
          </li>
          
        </ul>

        {session ? (
          <div className="flex items-center gap-4">
            <Link 
              href="/provider/dashboard"
              className="inline-flex items-center justify-center bg-[#1BA3A9] text-white px-7 py-3 rounded-full font-medium hover:bg-[#16837A] transition-colors text-[15px] tracking-wide"
            >
              Tableau de bord
            </Link>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center bg-[#F45B5B] text-white px-7 py-3 rounded-full font-medium hover:bg-[#d63d3d] transition-colors text-[15px] tracking-wide"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center justify-center bg-[#F45B5B] text-white px-7 py-3 rounded-full font-medium hover:bg-[#d63d3d] transition-colors text-[15px] tracking-wide"
            >
              Connexion
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
