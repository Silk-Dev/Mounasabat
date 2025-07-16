import React from "react";
import { FaSearch, FaClock, FaComments, FaUserTie, FaCalendarCheck } from "react-icons/fa";

const features = [
  {
    icon: <FaSearch className="text-pink-500 text-3xl" />,
    title: "Recherche instantanée",
    description: "Trouvez des lieux disponibles par date en quelques secondes.",
  },
  {
    icon: <FaClock className="text-blue-500 text-3xl" />,
    title: "Disponibilités en temps réel",
    description: "Voyez les créneaux libres immédiatement.",
  },
  {
    icon: <FaComments className="text-green-500 text-3xl" />,
    title: "Réservation facile",
    description: "Réservez sans appels ni déplacements.",
  },
  {
    icon: <FaUserTie className="text-yellow-500 text-3xl" />,
    title: "Support personnalisé",
    description: "Une équipe à votre écoute.",
  },
  {
    icon: <FaCalendarCheck className="text-purple-500 text-3xl" />,
    title: "Gestion complète en ligne",
    description: "Planifiez tout depuis votre espace personnel.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">
          Pourquoi choisir notre plateforme ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-gray-50 rounded-xl p-6 shadow hover:shadow-lg transition"
            >
              {feature.icon}
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 