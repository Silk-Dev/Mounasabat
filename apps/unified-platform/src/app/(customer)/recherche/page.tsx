"use client";
import TabsWithStar from "@/components/TabsWithStar";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface Service {
  id: string;
  nom: string;
  type: string;
  note: number;
  prix: string;
  description: string;
  image: string;
}

interface Prestataire {
  nom: string;
  image: string;
  ville: string;
  note: number;
  prix: string;
  date: string;
  description: string;
}

function CartePrestataire({ p }: { p: Prestataire }) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col md:flex-row w-full min-h-[180px] overflow-hidden">
      {/* Image à gauche */}
      <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
        <Image
          src={p.image}
          alt={p.nom}
          fill
          style={{ objectFit: "cover" }}
          className="md:static md:w-56 md:h-40"
        />
      </div>
      {/* Infos à droite */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{p.nom}</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">{p.ville}</div>
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{p.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">{"⭐".repeat(Math.round(p.note))}</span>
            <span className="text-xs text-gray-600">({p.note})</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="font-semibold text-base">{p.prix}</span>
            <span className="text-xs text-gray-500">{p.date}</span>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button className="bg-[#F16462] text-white px-5 py-2 rounded hover:bg-[#e04e4c] transition font-semibold">
            Voir le profil
          </button>
        </div>
      </div>
    </div>
  );
}

// Mettre à jour les données mock avec une description
const mockPrestataires: Prestataire[] = [
  {
    nom: "Studio Lumière",
    ville: "Sousse",
    note: 4.2,
    prix: "1500 TND",
    date: "10/08/2025",
    image: "/photographer.jpg",
    description: "Photographe professionnel spécialisé dans les mariages et événements.",
  },
  {
    nom: "Délices Traiteur",
    ville: "Sousse",
    note: 4.8,
    prix: "2000 TND",
    date: "10/08/2025",
    image: "/food.jpg",
    description: "Service traiteur haut de gamme pour tous vos événements.",
  },
  {
    nom: "Palais El Mechtel",
    ville: "Sousse",
    note: 4.5,
    prix: "3000 TND",
    date: "10/08/2025",
    image: "/venue.jpg",
    description: "Salle de réception élégante pour mariages et grandes occasions.",
  },
  {
    nom: "Fleurs de Rêve",
    ville: "Sousse",
    note: 4.0,
    prix: "800 TND",
    date: "10/08/2025",
    image: "/event-decor.jpg",
    description: "Fleuriste créatif pour des décorations florales inoubliables.",
  },
];

export default function Recherche() {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabSelect = (index: number) => {
    setSelectedTab(index);
    // You can add navigation logic here based on the selected tab
  };

  return (
    <div className="bg-white min-h-screen text-[#3A3A3A]">
      
      {/* Bannière avec barre de recherche */}
      <div className="bg-white pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Onglets personnalisés */}
            <TabsWithStar 
              selected={selectedTab} 
              onSelect={handleTabSelect} 
              categories={["Établissements", "Matériels", "Services"]}
            />
            {/* Barre de recherche */}
            <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300 mt-4">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Type d'événement</option>
                  <option value="wedding">Mariage</option>
                  <option value="engagement">Fiançailles</option>
                  <option value="birthday">Anniversaire</option>
                </select>
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Ville / région</option>
                  <option value="tunis">Tunis</option>
                  <option value="ariana">Ariana</option>
                  <option value="ben-arous">Ben Arous</option>
                  <option value="manouba">Manouba</option>
                  <option value="zaghouan">Zaghouan</option>
                  <option value="nabeul">Nabeul</option>
                  <option value="hammamet">Hammamet</option>
                  <option value="sousse">Sousse</option>
                  <option value="monastir">Monastir</option>
                  <option value="mahdia">Mahdia</option>
                  <option value="sfax">Sfax</option>
                  <option value="gabes">Gabès</option>
                  <option value="medenine">Médenine</option>
                  <option value="tataouine">Tataouine</option>
                  <option value="gafsa">Gafsa</option>
                  <option value="tozeur">Tozeur</option>
                  <option value="kebili">Kébili</option>
                  <option value="kasserine">Kasserine</option>
                  <option value="sidi-bouzid">Sidi Bouzid</option>
                  <option value="kairouan">Kairouan</option>
                  <option value="kef">Le Kef</option>
                  <option value="siliana">Siliana</option>
                  <option value="beja">Béja</option>
                  <option value="jendouba">Jendouba</option>
                  <option value="bizerte">Bizerte</option>
                </select>
                <input
                  type="date"
                  placeholder="jj/mm/aaaa"
                  className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="bg-[#F16462] text-white font-bold px-6 py-3 rounded hover:bg-[#e04e4c] transition"
                >
                  Rechercher
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex">
        {/* Sidebar des filtres */}
        <div className="w-80 bg-white border-r p-6">
          <h2 className="text-xl font-bold mb-6 text-[#3A3A3A]">Filtres</h2>
          
          {/* Catégorie de prestataires */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Catégorie de prestataires</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Photographe</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Traitéur</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Sallé dé réception</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Fleuriste</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">DJ</span>
              </label>
            </div>
          </div>
          {/* Barre de recherche prestataire */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher un prestataire..."
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500"
            />
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
                <span className="text-sm text-[#3A3A3A]">⭐ 1.0 + ét plus</span>
              </label>
            </div>
          </div>

          {/* Montre */}
          
        </div>

        {/* Zone des résultats */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="flex flex-col gap-6 w-full px-4">
            {mockPrestataires.map((p: Prestataire, i: number) => (
              <CartePrestataire key={i} p={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}