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

interface Service {
  nom: string;
  image: string;
  type: string;
  note: number;
  prix: string;
  description: string;
}

function CarteService({ s }: { s: Service }) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col md:flex-row w-full min-h-[180px] overflow-hidden">
      <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
        <Image
          src={s.image}
          alt={s.nom}
          fill
          style={{ objectFit: "cover" }}
          className="md:static md:w-56 md:h-40"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{s.nom}</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">{s.type}</div>
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{s.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">{"⭐".repeat(Math.round(s.note))}</span>
            <span className="text-xs text-gray-600">({s.note})</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="font-semibold text-base">{s.prix}</span>
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

const mockServices: Service[] = [
  {
    nom: "DJ Animation",
    type: "DJ / Animation",
    note: 4.8,
    prix: "900 TND",
    image: "/dj.jpg",
    description: "DJ professionnel pour animer vos soirées et mariages.",
  },
  {
    nom: "Photographe Pro",
    type: "Photographe",
    note: 4.7,
    prix: "1200 TND",
    image: "/photographer.jpg",
    description: "Photographe expérimenté pour immortaliser vos événements.",
  },
  {
    nom: "Coiffeuse & Maquilleuse",
    type: "Beauté",
    note: 4.5,
    prix: "600 TND",
    image: "/coiffeuse.jpg",
    description: "Coiffure et maquillage à domicile pour mariée et invitées.",
  },
  {
    nom: "Traiteur Gourmand",
    type: "Traiteur",
    note: 4.6,
    prix: "2000 TND",
    image: "/food.jpg",
    description: "Service traiteur haut de gamme pour tous types d'événements.",
  },
];

// --- Composant Établissement ---
function ContenuEtablissement() {
  // Copie ici le contenu principal de apps/marketing/src/app/recherche/etablissement/page.tsx
  // (enlève le header, garde juste la barre de recherche, sidebar, résultats, etc.)
  return (
    <div>
      {/* ...colle ici le JSX de la page établissement, sans le header... */}
    </div>
  );
}

// --- Composant Matériel ---
function ContenuMateriel() {
  // Copie ici le contenu principal de apps/marketing/src/app/recherche/materiel/page.tsx
  return (
    <div>
      {/* ...colle ici le JSX de la page matériel, sans le header... */}
    </div>
  );
}

// --- Composant Service ---
function ContenuService() {
  // Copie ici le contenu principal de apps/marketing/src/app/recherche/service/page.tsx
  return (
    <div>
      {/* ...colle ici le JSX de la page service, sans le header... */}
    </div>
  );
}

export default function ServicePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="bg-white min-h-screen text-[#3A3A3A]">
      <RechercheHeader />
      <div className="bg-white pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Type de service</option>
                  <option value="dj">DJ / Animation</option>
                  <option value="photo">Photographe</option>
                  <option value="beaute">Beauté</option>
                  <option value="traiteur">Traiteur</option>
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
          {/* Type de service */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Type de service</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">DJ / Animation</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Photographe</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Beauté</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Traiteur</span>
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
            {mockServices.map((s: Service, i: number) => (
              <CarteService key={i} s={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
