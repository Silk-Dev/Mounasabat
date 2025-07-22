"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

const etablissementsMariage = [
  {
    nom: "Palais des Noces",
    ville: "Tunis",
    description: "Salle de réception élégante pour mariages.",
    image: "/venue.jpg",
    prix: "3000 TND",
    note: 4.7,
  },
  {
    nom: "Traiteur Royal",
    ville: "Ariana",
    description: "Service traiteur haut de gamme pour mariages.",
    image: "/food.jpg",
    prix: "2000 TND",
    note: 4.8,
  },
  {
    nom: "Studio Lumière",
    ville: "Sousse",
    description: "Photographe professionnel spécialisé mariage.",
    image: "/photographer.jpg",
    prix: "1500 TND",
    note: 4.5,
  },
];

const filtres = {
  categories: [
    "Salle de réception",
    "Traiteur",
    "Photographe",
    "DJ",
    "Fleuriste",
    "Coiffeuse",
    "Voiture mariage",
    "Animateur",
  ],
  prix: ["0-500 TND", "500-1000 TND", "1000-2000 TND", "2000+ TND"],
  notes: ["⭐ 4+", "⭐ 3+", "⭐ 2+", "⭐ 1+"],
  commodites: [
    "Hébergement disponible",
    "Service traiteur",
    "Nettoyage inclus",
    "Salle de préparation",
    "Wifi",
    "Fournisseurs externes acceptés",
  ],
  langues: ["Arabe", "Français", "Anglais"],
};

function LocalHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${scrolled ? 'bg-[#e0e0e0]' : 'bg-[#3A3A3A]'}`}>
      <nav className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-4 transition-colors duration-300 ${scrolled ? 'text-black' : 'text-white'}`}>
        <div className="flex items-center gap-2">
          <img src="/logoo.png" alt="Monasabet Logo" className="h-14 w-auto" />
        </div>
        <ul className={`flex gap-8 text-base font-semibold mb-2 md:mb-0 transition-colors duration-300 ${scrolled ? 'text-black' : 'text-white'}`}>
          <li>
            <a href="/" className="hover:text-[#1CCFC9] transition">Accueil</a>
          </li>
          <li className="relative group">
            <a href="#" className="hover:text-[#1CCFC9] transition flex items-center">Organiser un événement ▼</a>
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
        <a href="/connexion" className="ml-4 flex items-center gap-2 bg-[#F45B5B] text-white px-6 py-4 rounded-full font-bold shadow hover:bg-[#d63d3d] transition">Connexion</a>
      </nav>
    </header>
  );
}

export default function Page({ params }: { params: any }) {
  const { eventType } = React.use(params) as { eventType: string };
  const searchParams = useSearchParams();
  const ville = searchParams.get('ville');
  const date = searchParams.get('date');

  if (eventType !== 'mariage' && eventType !== 'wedding' && eventType !== 'etablissement') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Page dédiée à l'événement : {eventType}</h1>
        <p>Cette page est en cours de création pour ce type d'événement.</p>
      </div>
    );
  }

  return (
    <>
      <LocalHeader />
      <div style={{ height: '80px' }} />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto py-8 px-0 md:px-0 gap-6 text-black">
        {/* Sidebar filtres */}
        <aside className="w-full md:w-64 bg-white border-r p-4 rounded-lg mb-4 md:mb-0 md:ml-0 md:mr-4 md:sticky md:top-[80px]">
          <h2 className="text-lg font-bold mb-4"></h2>
          {/* Section Établissement */}
          <fieldset className="mb-6">
            <legend className="font-semibold mb-2" style={{ color: '#1BA3A9' }}>Établissement</legend>
            {/* Type de prestataire */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Type de prestataire</label>
              <div className="flex flex-col gap-1">
                {['Salle de réception', 'Villa', 'Ferme', 'Hôtel'].map((type) => (
                  <label key={type} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {type}
                  </label>
                ))}
              </div>
            </div>
            {/* Ville / Région */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Ville / Région</label>
              <select className="w-full border rounded p-1">
                <option>Tunis</option>
                <option>Sfax</option>
                <option>Sousse</option>
                <option>Ariana</option>
                <option>Grand Tunis</option>
              </select>
            </div>
            {/* Date de disponibilité */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Date de disponibilité</label>
              <input type="date" className="w-full border rounded p-1" />
            </div>
            {/* Nombre d'invités */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Nombre d'invités</label>
              <div className="flex flex-col gap-1">
                {["50-100", "100-200", "200+"].map((n) => (
                  <label key={n} className="flex items-center text-sm">
                    <input type="radio" name="invites" className="mr-1" /> {n}
                  </label>
                ))}
              </div>
            </div>
            {/* Type d’espace */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Type d’espace</label>
              <div className="flex flex-col gap-1">
                {["Intérieur", "Extérieur couvert", "Extérieur non couvert"].map((e) => (
                  <label key={e} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {e}
                  </label>
                ))}
              </div>
            </div>
            {/* Hébergement disponible */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Hébergement disponible</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="hebergement" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="hebergement" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Wifi disponible */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Wifi disponible</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="wifi" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="wifi" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Nettoyage inclus */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Nettoyage inclus</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="nettoyage" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="nettoyage" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Langue parlée */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Langue parlée</label>
              <div className="flex flex-col gap-1">
                {["Arabe", "Français", "Anglais"].map((lang) => (
                  <label key={lang} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {lang}
                  </label>
                ))}
              </div>
            </div>
            {/* Prestataire vérifié */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Prestataire vérifié</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="verifie" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="verifie" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Note client */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Note client</label>
              <div className="flex flex-col gap-1">
                {[1,2,3,4,5].map((n) => (
                  <label key={n} className="flex items-center text-sm">
                    <input type="radio" name="note" className="mr-1" />
                    <span>{'⭐'.repeat(n)}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Section Services */}
          <fieldset className="mb-6">
            <legend className="font-semibold mb-2" style={{ color: '#1BA3A9' }}>Services</legend>
            {[
              { label: "Service traiteur", name: "traiteur" },
              { label: "Animateur / DJ / Musique", name: "dj" },
              { label: "Photographe / Vidéaste", name: "photo" },
              { label: "Coiffeuse / Maquilleuse", name: "coiff" },
              { label: "Décoratrice / Fleuriste", name: "deco" },
              { label: "Animation enfants / danse", name: "anim" },
              { label: "Salle de préparation", name: "prep" },
            ].map(f => (
              <div className="mb-3" key={f.name}>
                <label className="block font-medium mb-1">{f.label}</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-sm"><input type="radio" name={f.name} className="mr-1" />Oui</label>
                  <label className="flex items-center text-sm"><input type="radio" name={f.name} className="mr-1" />Non</label>
                </div>
              </div>
            ))}
            {/* Langue parlée */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Langue parlée</label>
              <div className="flex flex-col gap-1">
                {["Arabe", "Français", "Anglais"].map((lang) => (
                  <label key={lang} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {lang}
                  </label>
                ))}
              </div>
            </div>
            {/* Prestataire vérifié */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Prestataire vérifié</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="verifie2" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="verifie2" className="mr-1" />Non</label>
              </div>
            </div>
          </fieldset>

          {/* Section Matériel */}
          <fieldset className="mb-2">
            <legend className="font-semibold mb-2" style={{ color: '#1BA3A9' }}>Matériel</legend>
            {/* Voiture de mariage */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Voiture de mariage</label>
              <select className="w-full border rounded p-1">
                <option>Avec chauffeur</option>
                <option>Sans chauffeur</option>
              </select>
            </div>
            {/* Mobilier fourni */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Mobilier fourni</label>
              <div className="flex flex-col gap-1">
                {["Tables", "Chaises", "Tentes"].map((item) => (
                  <label key={item} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {item}
                  </label>
                ))}
              </div>
            </div>
            {/* Sonorisation / lumière */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Sonorisation / lumière</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="sonolum" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="sonolum" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Tente / Chapiteau */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Tente / Chapiteau</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="tente" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="tente" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Fournisseurs externes acceptés */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Fournisseurs externes acceptés</label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm"><input type="radio" name="fournisseur" className="mr-1" />Oui</label>
                <label className="flex items-center text-sm"><input type="radio" name="fournisseur" className="mr-1" />Non</label>
              </div>
            </div>
            {/* Autres équipements */}
            <div className="mb-3">
              <label className="block font-medium mb-1">Autres équipements</label>
              <div className="flex flex-col gap-1">
                {["Chauffage", "Climatiseur", "Écran LED"].map((item) => (
                  <label key={item} className="flex items-center text-sm">
                    <input type="checkbox" className="mr-1" /> {item}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
        </aside>
        {/* Zone résultats */}
        <main className="flex-1 md:ml-[296px]">
          <h1 className="text-2xl font-bold mb-6"></h1>
          <div className="flex flex-col gap-6">
            {etablissementsMariage.map((etab, i) => (
              <div key={i} className="bg-white rounded-xl shadow flex flex-col md:flex-row w-full min-h-[180px] overflow-hidden">
                <div className="relative w-full md:w-56 h-40 md:h-auto flex-shrink-0">
                  <img
                    src={etab.image}
                    alt={etab.nom}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{etab.nom}</h3>
                    </div>
                    <div className="text-sm text-black mb-2">{etab.ville}</div>
                    <p className="text-sm text-black mb-2 line-clamp-2">{etab.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400">{"⭐".repeat(Math.round(etab.note))}</span>
                      <span className="text-xs text-black">({etab.note})</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-semibold text-base">{etab.prix}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button className="bg-[#1BA3A9] text-white px-5 py-2 rounded hover:bg-[#148b8f] transition font-semibold">
                      Voir le profil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
} 