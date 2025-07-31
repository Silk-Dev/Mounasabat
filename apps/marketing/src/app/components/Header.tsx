'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const pathname = usePathname();
  const isAboutPage = pathname === "/a-propos";

  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${scrolled ? "bg-white/30 backdrop-blur-sm shadow-sm" : "bg-transparent"}
      `}
    >
      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Image src="/logoo.png" alt="Monasabet Logo" width={140} height={140} />

        <ul className={`
          flex gap-8 text-base font-semibold transition-colors duration-300
          ${isAboutPage ? "text-white" : scrolled ? "text-[#222]" : "text-white"}
        `}>
          <li><a href="/" className="hover:text-[#1CCFC9] transition">Accueil</a></li>
          <li className="relative group">
            <a href="#" className="hover:text-[#1CCFC9] transition flex items-center">
              Organiser un événement ▼
            </a>
            {isMounted && (
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <a href="/lieux" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white">Lieux de réception</a>
                <a href="/prestataires" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white">Prestataires de services</a>
                <a href="/idees-conseils" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white">Idées & Conseils</a>
              </div>
            )}
          </li>
          <li><a href="/a-propos" className="hover:text-[#1CCFC9] transition">À propos</a></li>
          <li><a href="/contact" className="hover:text-[#1CCFC9] transition">Contact</a></li>
        </ul>

        <div className="flex items-center gap-4">
          <button 
            className="flex items-center gap-2 text-sm font-medium text-[#3A3A3A] hover:text-[#1CCFC9] transition"
            onClick={() => {/* Add search functionality here */}}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span>Recherche avancée</span>
          </button>
          <a
            href="/connexion"
            className="ml-2 flex items-center gap-2 px-6 py-4 rounded-full font-bold shadow bg-[#F45B5B] text-white hover:bg-[#d63d3d] transition"
          >
            Connexion
          </a>
        </div>
      </nav>
    </header>
  );
}
