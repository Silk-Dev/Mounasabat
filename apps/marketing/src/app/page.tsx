'use client';

import { motion } from 'framer-motion';
import { Button } from '@mounasabet/ui';
import { Sparkles, CalendarHeart, MapPin, Gift, Handshake, Heart } from 'lucide-react';
import BlurText from './BlurText';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main
        className="min-h-screen bg-cover bg-center bg-no-repeat p-6 flex items-center justify-center bg-[#FFF6F6]"
        style={{ backgroundImage: 'url(/event-decor.jpg)' }}
      >
        <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <BlurText
            text="Plan the Perfect Event"
            delay={120}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-5xl font-bold text-center text-[#F16462] mb-2"
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />

          <BlurText
            text="Mounasabet is the most comprehensive resource to help you plan your event."
            delay={60}
            animateBy="words"
            direction="top"
            className="text-base md:text-lg text-[#3A3A3A] mb-6"
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />

          <div className="w-full flex justify-center gap-4 mt-2">
            <Link href="/events" passHref>
              <Button className="flex-1 bg-[#F16462] text-white text-lg px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#d63d3d] transition">
                <CalendarHeart className="mr-2" size={20} />
                Find a Venue
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <section className="w-full bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-5xl font-serif font-bold text-center text-[#222] mb-12">Find Your Venue</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.1 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)' }}
            >
              <img src="/partyvenue.jpg" alt="Party Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Gift className="text-[#D4843A]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Party Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a party venue for your anniversary, birthday party, office party, or a reunion of family and friends.</p>
                <Link href="/events?type=party" passHref>
                  <Button className="bg-white text-[#D4843A] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.3 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)' }}
            >
              <img src="/weddingvenue.jpg" alt="Wedding Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Heart className="text-[#8B6A8C]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Wedding Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a wedding venue for your reception. Banquet halls are popular, Barn weddings are a hot trend, and there are many unique venues like museums, zoos, and wineries.</p>
                <Link href="/events?type=wedding" passHref>
                  <Button className="bg-white text-[#8B6A8C] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.05, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.7, delay: 0.5 }}
              className="flex-1 flex flex-col items-center rounded-lg overflow-hidden shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3A3A3A 0%, #F16462 60%, #1BA3A9 100%)' }}
            >
              <img src="/meetingvenue.jpg" alt="Meeting Venue" className="w-full h-56 object-cover" />
              <div className="flex flex-col items-center px-6 pb-8 pt-0 flex-1 w-full">
                <div className="bg-white rounded-full shadow -mt-12 mb-4 p-4 border-4 border-white">
                  <Handshake className="text-[#8AA05B]" size={48} />
                </div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2 mt-2">Meeting Venue</h3>
                <p className="text-white text-center mb-6 text-lg">Find a meeting venue for any business gathering that can range from a small group in a hotel board room to a large conference at an event center.</p>
                <Link href="/events?type=meeting" passHref>
                  <Button className="bg-white text-[#8AA05B] font-bold px-8 py-3 rounded shadow hover:bg-gray-100 transition text-lg">Find Your Venue</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
