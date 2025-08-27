"use client";

import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaTwitter, FaInstagram, FaPinterest, FaLinkedinIn } from "react-icons/fa";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Footer() {
  const { ref, inView } = useInView({ threshold: 0.1 });
  return (
    <motion.footer
      ref={ref}
      initial={{ y: 100, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="pt-12 pb-6 px-4 mt-auto"
      style={{
        background: "linear-gradient(180deg, #fff6f6 0%, #faceb3ff 100%)",
        color: "#3A3A3A"
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-0 justify-between items-start pb-8">
        {/* Logo & réseaux sociaux */}
        <div className="flex-1 flex flex-col items-start mb-8 md:mb-0">
          <Image src="/logoo.png" alt="Monasabet logo" width={180} height={180} className="mb-2" />
          <div className="mt-4">
            <div className="mb-2 font-semibold text-lg">Suivez-nous</div>
            <div className="flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 rounded p-2 hover:bg-white/40 transition"><FaFacebookF size={22} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 rounded p-2 hover:bg-white/40 transition"><FaTwitter size={22} /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 rounded p-2 hover:bg-white/40 transition"><FaInstagram size={22} /></a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 rounded p-2 hover:bg-white/40 transition"><FaPinterest size={22} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-white/20 rounded p-2 hover:bg-white/40 transition"><FaLinkedinIn size={22} /></a>
        </div>
          </div>
          </div>
        {/* Liens */}
        <div className="flex-[4] w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Liens rapides */}
          <div>
            <div className="font-semibold text-lg mb-2">Liens rapides</div>
            <ul className="space-y-2">
              <li><Link href="/">Accueil</Link></li>
              <li><Link href="/a-propos">À propos</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/conditions">Conditions d’utilisation</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
            </ul>
          </div>
          {/* Organiser un événement */}
          <div>
            <div className="font-semibold text-lg mb-2">Organiser un événement</div>
            <ul className="space-y-2">
              <li><Link href="/fonctionnement">Comment ça marche</Link></li>
              <li><Link href="/lieux">Lieux de réception</Link></li>
              <li><Link href="/prestataires">Prestataires de services</Link></li>
              <li><Link href="/produits">Produits personnalisés</Link></li>
            </ul>
          </div>
          {/* Promouvoir mon activité */}
          <div>
            <div className="font-semibold text-lg mb-2">Promouvoir mon activité</div>
            <ul className="space-y-2">
              <li><Link href="/pour-les-pros">Pourquoi Monasabet</Link></li>
              <li><Link href="/blog">Blog Monasabet</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
              <li><Link href="/inscription-prestataire">Inscrire mon activité</Link></li>
            </ul>
          </div>
        </div>
      </div>
      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-8 text-sm text-center border-t border-white/20 pt-4">
        © 2025 Monasabet. Tous droits réservés
      </div>
    </motion.footer>
  );
} 