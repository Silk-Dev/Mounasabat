"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "../components/Header";
import Image from "next/image";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation parallax pour l'image
    if (parallaxRef.current) {
      gsap.to(parallaxRef.current, {
        yPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: parallaxRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici vous pouvez ajouter la logique d'envoi du formulaire
    console.log("Formulaire soumis:", formData);
    alert("Merci pour votre message ! Nous vous répondrons bientôt.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ backgroundColor: '#FFF1E8' }}>
      <Header />
      
      {/* Section Parallax avec image */}
      <section className="relative h-[60vh] overflow-hidden">
        <div 
          ref={parallaxRef}
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
        >
          <Image
            src="/immg.png"
            alt="Image parallax contact"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay gradient - très sombre */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90"></div>
        </div>
        
        {/* Contenu sur l'image */}
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto"
          >
            
          
            
            {/* Contenu déplacé */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#F16462]">
                Contactez-nous
              </h2>
              <p className="text-lg md:text-xl text-white/90">
                Nous sommes là pour vous aider à planifier votre événement parfait
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Content - déplacé en haut */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Informations de contact - Magic Bento */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-[#3A3A3A] mb-4">
                  Parlons de votre projet
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Notre équipe d'experts est prête à vous accompagner dans la planification de votre événement. 
                  N'hésitez pas à nous contacter pour discuter de vos besoins.
                </p>
              </div>

              {/* Magic Bento Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Email Card */}
                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative bg-gradient-to-br from-[#F16462]/10 to-[#F16462]/5 p-6 rounded-2xl border border-[#F16462]/20 hover:border-[#F16462]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#F16462]/20"
                >
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#F16462] to-[#F16462]/80 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <FiMail className="text-white text-xl" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#F16462] transition-colors">Email</h3>
                      <p className="text-gray-600 font-medium">contact@mounasabet.com</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F16462]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </motion.div>

                {/* Phone Card */}
                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative bg-gradient-to-br from-[#1BA3A9]/10 to-[#1BA3A9]/5 p-6 rounded-2xl border border-[#1BA3A9]/20 hover:border-[#1BA3A9]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#1BA3A9]/20"
                >
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#1BA3A9] to-[#1BA3A9]/80 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <FiPhone className="text-white text-xl" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#1BA3A9] transition-colors">Téléphone</h3>
                      <p className="text-gray-600 font-medium">+216 XX XXX XXX</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1BA3A9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </motion.div>

                {/* Address Card */}
                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative bg-gradient-to-br from-[#F16462]/10 to-[#F16462]/5 p-6 rounded-2xl border border-[#F16462]/20 hover:border-[#F16462]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#F16462]/20"
                >
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="w-14 h-14 bg-gradient-to-br from-[#F16462] to-[#F16462]/80 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <FiMapPin className="text-white text-xl" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#F16462] transition-colors">Adresse</h3>
                      <p className="text-gray-600 font-medium">Tunis, Tunisie</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F16462]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </motion.div>
              </div>

              
            </motion.div>

            {/* Formulaire de contact */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-6">
                Envoyez-nous un message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                      Nom complet 
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800"
                      placeholder="Votre nom"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                      Email 
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-800 mb-2">
                    Sujet 
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800"
                    placeholder="Sujet de votre message"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-2">
                    Message 
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition resize-none text-gray-800"
                    placeholder="Décrivez votre projet ou posez votre question..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F16462] to-[#1BA3A9] text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition duration-300 flex items-center justify-center space-x-2"
                >
                  <FiSend />
                  <span>Envoyer le message</span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#3A3A3A] mb-4">
              Questions fréquentes
            </h2>
            <p className="text-lg text-gray-600">
              Trouvez rapidement les réponses à vos questions
            </p>
          </motion.div>

          <div className="space-y-6">
            <div className="bg-[#FFF6F6] p-6 rounded-lg">
              <h3 className="font-semibold text-[#3A3A3A] mb-2">
                Comment réserver un prestataire ?
              </h3>
              <p className="text-gray-600">
                Utilisez notre moteur de recherche pour trouver des prestataires dans votre région, 
                consultez leurs profils et contactez-les directement via notre plateforme.
              </p>
            </div>

            <div className="bg-[#FFF6F6] p-6 rounded-lg">
              <h3 className="font-semibold text-[#3A3A3A] mb-2">
                Y a-t-il des frais pour utiliser Weddni ?
              </h3>
              <p className="text-gray-600">
                La recherche et la consultation des profils sont entièrement gratuites. 
                Seuls les prestataires paient des frais d'abonnement pour être référencés.
              </p>
            </div>

            <div className="bg-[#FFF6F6] p-6 rounded-lg">
              <h3 className="font-semibold text-[#3A3A3A] mb-2">
                Comment devenir prestataire partenaire ?
              </h3>
              <p className="text-gray-600">
                Contactez-nous via ce formulaire en précisant "Partenariat prestataire" 
                dans le sujet. Notre équipe vous expliquera le processus d'inscription.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
