"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "@/app/components/Header";

interface Etablissement {
  nom: string;
  image: string;
  categorie: string;
  ville: string;
  note: number;
  prix: string;
  description: string;
  evenement: string;
}

function CarteEtablissement({ e }: { e: Etablissement }) {
  return (
    <div className="bg-white rounded-xl shadow flex flex-col md:flex-row w-full min-h-[180px] overflow-hidden">
      <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
        <Image
          src={e.image}
          alt={e.nom}
          fill
          style={{ objectFit: "cover" }}
          className="md:static md:w-56 md:h-40"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{e.nom}</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">{e.categorie} - {e.ville}</div>
          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{e.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">{"⭐".repeat(Math.round(e.note))}</span>
            <span className="text-xs text-gray-600">({e.note})</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="font-semibold text-base">{e.prix}</span>
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

const mockEtablissements: Etablissement[] = [
  {
    nom: "Palais des Noces",
    categorie: "Salle de réception",
    ville: "Tunis",
    note: 4.7,
    prix: "3000 TND",
    image: "/venue.jpg",
    description: "Salle de réception élégante pour mariages.",
    evenement: "mariage",
  },
  {
    nom: "Villa Les Oliviers",
    categorie: "Villa",
    ville: "Sousse",
    note: 4.5,
    prix: "2500 TND",
    image: "/maison.png",
    description: "Villa de charme pour fiançailles et anniversaires.",
    evenement: "anniversaire",
  },
  {
    nom: "Hôtel El Mouradi",
    categorie: "Hôtel",
    ville: "Hammamet",
    note: 4.3,
    prix: "4000 TND",
    image: "/hotel.jpg",
    description: "Hôtel 5 étoiles avec grande salle de réception.",
    evenement: "mariage",
  },
  {
    nom: "Domaine Les Jasmins",
    categorie: "Ferme",
    ville: "Ariana",
    note: 4.6,
    prix: "3500 TND",
    image: "/ferme.jpg",
    description: "Ferme champêtre pour mariages et fêtes en plein air.",
    evenement: "fiancaille",
  },
];

export default function EtablissementPage() {
  const [evenement, setEvenement] = useState<string>("");

  const etablissementsFiltres = evenement
    ? mockEtablissements.filter(e => e.evenement === evenement)
    : mockEtablissements;

  return (
    <div className="bg-white min-h-screen text-[#3A3A3A]">
      <Header />
      <div className="bg-white pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Catégorie</option>
                  <option value="salle">Salle de réception</option>
                  <option value="villa">Villa</option>
                  <option value="hotel">Hôtel</option>
                  <option value="ferme">Ferme</option>
                </select>
                <select className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500">
                  <option value="" disabled>Ville / région</option>
                  <option value="tunis">Tunis</option>
                  <option value="ariana">Ariana</option>
                  <option value="sousse">Sousse</option>
                  <option value="hammamet">Hammamet</option>
                </select>
                <input
                  type="date"
                  placeholder="jj/mm/aaaa"
                  className="px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#F16462] text-gray-600 placeholder-gray-500"
                />
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

      <div className="flex">
        {/* Sidebar des filtres */}
        <div className="w-80 bg-white border-r p-6">
          <h2 className="text-xl font-bold mb-6 text-[#3A3A3A]">Filtres</h2>
          {/* Catégorie */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Catégorie</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Salle de réception</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Villa</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Hôtel</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Ferme</span>
              </label>
            </div>
          </div>
          {/* Ville */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Ville</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Tunis</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Ariana</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Sousse</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">Hammamet</span>
              </label>
            </div>
          </div>
          {/* Prix */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#3A3A3A]">Prix</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">0-2000 TND</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">2000-3000 TND</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-[#3A3A3A]">3000+ TND</span>
              </label>
            </div>
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
            {etablissementsFiltres.map((e: Etablissement, i: number) => (
              <CarteEtablissement key={i} e={e} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}