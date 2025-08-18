import React from "react";

interface TabsWithStarProps {
  selected: number;
  onSelect: (idx: number) => void;
  categories?: string[];
}

export default function TabsWithStar({
  selected,
  onSelect,
  categories = ["Établissements", "Matériels", "Services"],
}: TabsWithStarProps) {
  return (
    <div className="w-full flex justify-center mt-8">
      <div className="relative flex items-end">
        {/* Barre de fond arrondie */}
        <div className="absolute left-0 right-0 h-16 bg-white rounded-full border border-gray-300 shadow-md" style={{zIndex: 0, minWidth: 380}} />
        {/* Onglets */}
        <div className="flex px-6 space-x-6" style={{zIndex: 1}}>
          {categories.map((cat, idx) => (
            <div key={cat} className="flex flex-col items-center">
              <button
                className={`px-6 py-2 font-bold text-[20px] leading-tight ${selected === idx ? "text-white bg-[#F16462]" : "text-[#8B2C3B] bg-white"} border border-[#8B2C3B] rounded-t-xl rounded-b-none shadow-sm transition-colors duration-200 focus:outline-none`}
                style={{
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  marginBottom: 0,
                  minWidth: 150,
                  boxShadow: selected === idx ? "0 2px 8px rgba(0,0,0,0.04)" : undefined,
                  position: "relative",
                  zIndex: selected === idx ? 2 : 1
                }}
                onClick={() => onSelect(idx)}
                type="button"
              >
                {cat}
              </button>
              {/* Étoile sous l'onglet sélectionné */}
              <div style={{height: 18}}>
                {selected === idx && (
                  <span className="text-yellow-400 text-xl mt-1">★</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 