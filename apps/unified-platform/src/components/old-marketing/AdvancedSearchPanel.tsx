'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

type Category = {
  id: string;
  name: string;
  icon: string;
  filters: string[];
};

type AdvancedSearchPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdvancedSearchPanel({ isOpen, onClose }: AdvancedSearchPanelProps) {
  if (!isOpen) return null;

  const categories: Category[] = [
    {
      id: 'etablissements',
      name: 'Établissements',
      icon: '🏨',
      filters: [
        'Salles de réception',
        'Hôtels',
        'Restaurants',
        'Villas',
        'Plages',
        'Jardins',
        'Châteaux',
        'Salles des fêtes',
        'Espaces événementiels',
        'Séminaires',
      ],
    },
    {
      id: 'materiels',
      name: 'Matériels',
      icon: '🎪',
      filters: [
        'Mobilier',
        'Décoration',
        'Éclairage',
        'Sonorisation',
        'Écrans & Vidéos',
        'Tentes & Chapiteaux',
        'Vaisselle & Couverts',
        'Linge de table',
        'Stands & Signalétique',
      ],
    },
    {
      id: 'services',
      name: 'Services',
      icon: '🎭',
      filters: [
        'Traiteurs',
        'Pâtisserie',
        'Animation',
        'Photographie',
        'Fleurs',
        'Coiffure & Maquillage',
        'Transport',
        'Sécurité',
        'Hôtesses & Hôtes',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
            onClick={onClose}
          ></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white/95 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 border border-gray-200">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1CCFC9]"
              onClick={onClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="relative">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 pl-4 pr-12 py-3 text-base text-gray-800 placeholder-gray-500 focus:border-[#1CCFC9] focus:ring-2 focus:ring-[#1CCFC9] focus:ring-opacity-50"
                  placeholder="Rechercher une catégorie ou un nom"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 bg-white/80 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="mr-2 text-xl">{category.icon}</span>
                      {category.name}
                    </h3>
                    <ul className="space-y-2">
                      {category.filters.map((filter, index) => (
                        <li key={index}>
                          <a
                            href="#"
                            className="text-gray-700 hover:text-[#1CCFC9] hover:font-medium block py-1.5 px-2 text-sm rounded hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              // Handle filter selection
                              console.log(`Selected filter: ${category.name} - ${filter}`);
                            }}
                          >
                            {filter}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1CCFC9] focus:ring-offset-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-[#1CCFC9] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#1ab9b4] focus:outline-none focus:ring-2 focus:ring-[#1CCFC9] focus:ring-offset-2 transition-colors"
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
