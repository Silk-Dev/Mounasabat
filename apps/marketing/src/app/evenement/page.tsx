"use client";
import React, { useState } from "react";

const categories = [
  "Tous", "Mariage", "Anniversaire", "Fiançailles", "Séminaire"
];

const events = [
  {
    title: "Mariage de Rania & Sami",
    date: "2024-08-12",
    location: "Tunis, Laico Hotel",
    type: "Mariage",
    image: "/weddingvenue.jpg",
    description: "Un mariage chic et romantique dans un palace tunisien."
  },
  {
    title: "Anniversaire de Lina (18 ans)",
    date: "2024-09-05",
    location: "Sousse, Plage privée",
    type: "Anniversaire",
    image: "/partyvenue.jpg",
    description: "Soirée festive sur la plage avec DJ et feu d'artifice."
  },
  {
    title: "Fiançailles de Yasmine & Mehdi",
    date: "2024-07-20",
    location: "Hammamet, Villa privée",
    type: "Fiançailles",
    image: "/meetingvenue.jpg",
    description: "Cérémonie intime et élégante en bord de mer."
  },
  // Ajoute d'autres événements ici
];

export default function EventPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [filters, setFilters] = useState({ date: "", location: "", type: "" });

  const filteredEvents = events.filter(ev =>
    (selectedCategory === "Tous" || ev.type === selectedCategory) &&
    (filters.date === "" || ev.date === filters.date) &&
    (filters.location === "" || ev.location.toLowerCase().includes(filters.location.toLowerCase())) &&
    (filters.type === "" || ev.type === filters.type)
  );

  return (
    <div className="min-h-screen bg-[#FFF6F6] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Catégories */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-semibold border transition-all duration-200 ${selectedCategory === cat ? "bg-[#F16462] text-white border-[#F16462] shadow" : "bg-white text-[#F16462] border-[#F16462] hover:bg-[#F16462]/10"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
            className="text-[#3A3A3A] border border-rose-200 bg-[#fff6f6] rounded-lg px-4 py-2"
            placeholder="jj/mm/aaaa"
          />
          <input
            type="text"
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            className="px-4 py-2 rounded border border-[#F16462]/40 focus:ring-2 focus:ring-[#F16462] placeholder-[#3A3A3A]"
            placeholder="Lieu (ville, salle...)"
          />
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="px-4 py-2 rounded border border-[#F16462]/40 focus:ring-2 focus:ring-[#F16462] text-[#3A3A3A]"
          >
            <option value="">Type de service</option>
            {categories.filter(c => c !== "Tous").map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {/* Grille d'événements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center text-[#F16462] text-lg">Aucun événement trouvé.</div>
          ) : filteredEvents.map((ev, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:scale-105 hover:shadow-2xl transition-transform duration-300">
              <img src={ev.image} alt={ev.title} className="w-full h-48 object-cover" />
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-2xl font-bold text-[#F16462] mb-2">{ev.title}</h2>
                <div className="flex flex-wrap gap-2 text-sm text-[#1BA3A9] mb-2">
                  <span>{ev.date}</span>
                  <span>•</span>
                  <span>{ev.location}</span>
                  <span>•</span>
                  <span>{ev.type}</span>
                </div>
                <p className="text-[#3A3A3A] mb-4 flex-1">{ev.description}</p>
                <button className="mt-auto bg-[#F16462] text-white font-bold px-6 py-2 rounded-full shadow hover:bg-[#d63d3d] transition">Voir l'événement</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}