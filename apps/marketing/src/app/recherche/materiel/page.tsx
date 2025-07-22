"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function RechercheHeader() {
  return (
    <header className="bg-[#3A3A3A] fixed top-0 left-0 w-full z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <img src="/logoo.png" alt="Monasabet Logo" className="h-16 w-auto cursor-pointer" />
          </Link>
        </div>
        <ul className="flex gap-8 text-base font-semibold text-white mb-2 md:mb-0">
          <li>
            <a href="/" className="hover:text-[#1CCFC9] transition">Accueil</a>
          </li>
          <li className="relative group">
            <a href="#" className="hover:text-[#1CCFC9] transition flex items-center">
              Organiser un événement ▼
            </a>
            <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <a href="/lieux" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white">Lieux de réception</a>
              <a href="/prestataires" className="block px-4 py-2 text-[#3A3A3A] hover:bg-[#1CCFC9] hover:text-white">Prestataires de services</a>
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
        <a href="/connexion" className="ml-4 flex items-center gap-2 bg-[#F45B5B] text-white px-6 py-4 rounded-full font-bold shadow hover:bg-[#d63d3d] transition">
          Connexion
        </a>
      </nav>
    </header>
  );
}

interface Materiel {
  nom: string;
  image: string;
  type: string;
  note: number;
  prix: string;
  description: string;
  evenement: string; // Added evenement field
}

function CarteMateriel({ m }: { m: Materiel }) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col md:flex-row w-full min-h-[180px] overflow-hidden">
      <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
        <Image
          src={m.image}
          alt={m.nom}
          fill
          style={{ objectFit: "cover" }}
          className="md:static md:w-56 md:h-40"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{m.nom}</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">{m.type}</div>
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{m.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">{"⭐".repeat(Math.round(m.note))}</span>
            <span className="text-xs text-gray-600">({m.note})</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="font-semibold text-base">{m.prix}</span>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button className="bg-[#1BA3A9] text-white px-5 py-2 rounded hover:bg-[#148b8f] transition font-semibold">
            Voir le profil
          </button>
        </div>
      </div>
    </div>
  );
}

const mockMateriels: Materiel[] = [
  {
    nom: "Tente de réception",
    type: "Tente/Chapiteau",
    note: 4.5,
    prix: "500 TND",
    image: "/tente.jpg",
    description: "Grande tente pour événements extérieurs, résistante et élégante.",
    evenement: "mariage", // Added evenement field
  },
  {
    nom: "Sonorisation Pro",
    type: "Sonorisation/Lumière",
    note: 4.7,
    prix: "800 TND",
    image: "/sound.jpg",
    description: "Pack complet sono et lumières pour vos soirées et mariages.",
    evenement: "mariage", // Added evenement field
  },
  {
    nom: "Voiture de mariage",
    type: "Voiture",
    note: 4.3,
    prix: "1200 TND",
    image: "/voiture.jpg",
    description: "Voiture de luxe avec chauffeur pour un mariage inoubliable.",
    evenement: "mariage", // Added evenement field
  },
  {
    nom: "Tables & Chaises",
    type: "Mobilier",
    note: 4.0,
    prix: "300 TND",
    image: "/tables.jpg",
    description: "Location de tables et chaises pour tous types d'événements.",
    evenement: "mariage", // Added evenement field
  },
];

export default function MaterielPage() {
  const [evenement, setEvenement] = useState<string>("");

  const materielsFiltres = evenement
    ? mockMateriels.filter(m => m.evenement === evenement)
    : mockMateriels;

  return (
    <div className="bg-white min-h-screen text-[#3A3A3A]">
      <RechercheHeader />
      <div className="bg-white pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600"
                  value={evenement}
                  onChange={e => setEvenement(e.target.value)}
                >
                  <option value="" disabled>Type d'événement</option>
                  <option value="mariage">Mariage</option>
                  <option value="fiancaille">Fiançailles</option>
                  <option value="anniversaire">Anniversaire</option>
                  <option value="bapteme">Baptême</option>
                  <option value="autre">Autre</option>
                </select>
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Type de matériel</option>
                  <option value="tente">Tente/Chapiteau</option>
                  <option value="sono">Sonorisation/Lumière</option>
                  <option value="mobilier">Mobilier</option>
                  <option value="voiture">Voiture</option>
                </select>
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Prix</option>
                  <option value="0-500">0-500 TND</option>
                  <option value="500-1000">500-1000 TND</option>
                  <option value="1000-2000">1000-2000 TND</option>
                  <option value="2000+">2000+ TND</option>
                </select>
                <input
                  type="date"
                  placeholder="jj/mm/aaaa"
                  className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="bg-[#1BA3A9] text-white font-bold px-6 py-3 rounded hover:bg-[#148b8f] transition"
                >
                  Rechercher
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar des filtres */}
        <div className="w-80 bg-white border-r p-6">
          <h2 className="text-xl font-bold mb-6 text-[#3A3A3A]">Filtres</h2>
          {/* Type de matériel */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Type de matériel</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Tente/Chapiteau</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Sonorisation/Lumière</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Mobilier</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Voiture</span>
              </label>
            </div>
          </div>
          {/* Prix */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Prix</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">0-500 TND</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">500-1000 TND</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">1000-2000 TND</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">2000+ TND</span>
              </label>
            </div>
          </div>
          {/* Disponibilité */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Disponibilité</h3>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-[#3A3A3A]">Disponible le 10/08/2025</span>
            </label>
          </div>
          {/* Note */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Note</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">⭐ 4.0 + et plus</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">⭐ 3.0 + et plus</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">⭐ 2.0 + et plus</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">⭐ 1.0 + et plus</span>
              </label>
            </div>
          </div>
        </div>
        {/* Zone des résultats */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="flex flex-col gap-6 w-full px-4">
            {materielsFiltres.map((m: Materiel, i: number) => (
              <CarteMateriel key={i} m={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
