"use client";

import { motion } from "framer-motion";
import { Button } from "@weddni/ui";
import { Sparkles, CalendarHeart, MapPin, Gift, Handshake, Heart } from "lucide-react";
import BlurText from "./BlurText";

export default function Home() {
  return (
    <>
      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat p-6 flex items-center justify-center bg-[#FFF6F6]"
        style={{ backgroundImage: 'url(/image33.jpg)' }}
      >
        <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <BlurText
            text="Planifiez l'événement parfait"
            delay={120}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-5xl font-bold text-center text-[#F16462] mb-2"
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />

          <BlurText
            text="Mounasabet est la ressource la plus complète pour vous aider à organiser votre événement."
            delay={60}
            animateBy="words"
            direction="top"
            className="text-base md:text-lg text-[#3A3A3A] mb-1"
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />

          <BlurText
            text="Trouvez dès maintenant votre lieu de mariage, de fête ou de réunion."
            delay={60}
            animateBy="words"
            direction="top"
            className="text-base md:text-lg text-[#3A3A3A] mb-6"
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />

          {/* Onglets de sélection */}
          <div className="w-full flex rounded-t-lg overflow-hidden border-b-2 border-[#F16462]/30 mb-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-[#F16462] font-bold border-b-4 border-[#F16462] bg-white">
              <Heart className="text-[#F16462]" size={22} />
              Wedding
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-[#3A3A3A] font-bold bg-[#1BA3A9]/90 border-b-4 border-[#1BA3A9]">
              <Gift className="text-[#F16462]" size={22} />
              Party
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-[#3A3A3A] font-bold bg-[#1BA3A9]/90 border-b-4 border-[#1BA3A9]">
              <Handshake className="text-[#1BA3A9]" size={22} />
              Meeting
            </button>
          </div>

          {/* Champ de recherche */}
          <form className="w-full flex mb-6">
            <input
              type="text"
              className="px-4 py-2 rounded border border-[#F16462]/40 focus:ring-2 focus:ring-[#F16462] placeholder-[#3A3A3A] text-[#3A3A3A]"
              placeholder="jj/mm/aaaa"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#1BA3A9] text-white font-bold rounded-r-md text-lg flex items-center gap-2 hover:bg-[#148b8f] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
              Search Venues
            </button>
          </form>

          {/* Boutons d'action */}
          <div className="w-full flex flex-col md:flex-row justify-center gap-4 mt-2">
            <button className="flex-1 bg-[#F16462] text-white text-lg px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#d63d3d] transition">
              <CalendarHeart className="mr-2" size={20} />
              Réserver une date
            </button>
            <button className="flex-1 border-2 border-[#F16462] text-[#F16462] text-lg px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#FFF6F6] transition">
              <MapPin className="mr-2" size={20} />
              Explorer les lieux
            </button>
          </div>
        </div>

        {/* Image décorative juste en dessous du bloc principal */}
        <div className="w-full flex justify-center my-8">
         
        </div>
      </main>

      {/* Find Your Venue section sur fond blanc, plus bas */}
      <section className="w-full bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-serif font-bold text-center text-[#222] mb-12">Find Your Venue</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
            {/* Party Venue */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.1 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: "linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)" }}
            >
              <img src="/partyvenue.jpg" alt="Party Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Gift className="text-[#D4843A]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Party Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a party venue for you anniversary, birthday party, office party, or a reunion of family and friends.</p>
                <button className="bg-white text-[#D4843A] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</button>
              </div>
            </motion.div>
            {/* Wedding Venue */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.3 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: "linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)" }}
            >
              <img src="/weddingvenue.jpg" alt="Wedding Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Heart className="text-[#8B6A8C]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Wedding Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a wedding venue for your reception. Banquet halls are popular, Barn weddings are a hot trend, and there are many unique venues like museums, zoos, and wineries.</p>
                <button className="bg-white text-[#8B6A8C] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</button>
              </div>
            </motion.div>
            {/* Meeting Venue */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.5 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: "linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)" }}
            >
              <img src="/meetingvenue.jpg" alt="Meeting Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Handshake className="text-[#8AA05B]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Meeting Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a meeting venue for any business gathering that can range from a small group in a hotel board room to a large conference at an event center.</p>
                <button className="bg-white text-[#8AA05B] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
