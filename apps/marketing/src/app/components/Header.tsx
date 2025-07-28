"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
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
        ${scrolled ? "bg-white/40 backdrop-blur-md shadow-sm" : "bg-transparent"}
      `}
    >
      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Image
          src="/logoo.png"
          alt="Monasabet Logo"
          width={140}
          height={140}
        />
        {/* Menu */}
        <ul className={`flex gap-8 text-base font-semibold transition-colors duration-300
          ${scrolled ? "text-[#222]" : "text-white"}
        `}>
          <li>
            <a href="/" className="hover:text-[#1CCFC9] transition">
              Accueil
            </a>
          </li>
          <li className="relative group">
            <a
              href="#"
              className="hover:text-[#1CCFC9] transition flex items-center"
            >
              Organiser un événement ▼
            </a>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href="/lieux"
                className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white"
              >
                Lieux de réception
              </a>
              <a
                href="/prestataires"
                className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white"
              >
                Prestataires de services
              </a>
            </div>
          </li>
          <li>
            <a href="/idees-conseils" className="hover:text-[#1CCFC9] transition">Idées & Conseils</a>
          </li>
          <li>
            <a href="/a-propos" className="hover:text-[#1CCFC9] transition">À propos</a>
          </li>
          <li>
            <a href="/contact" className="hover:text-[#1CCFC9] transition">Contact</a>
          </li>
        </ul>
        {/* Connexion */}
        <a
          href="/connexion"
          className={`ml-4 flex items-center gap-2 px-6 py-4 rounded-full font-bold shadow transition
            ${scrolled
              ? "bg-[#F45B5B] text-white hover:bg-[#d63d3d]"
              : "bg-[#F45B5B] text-white hover:bg-[#d63d3d]"}
          `}
        >
          Connexion
        </a>
      </nav>
    </header>
  );
}
