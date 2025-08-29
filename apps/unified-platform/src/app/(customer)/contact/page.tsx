"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string; // honeypot
};

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    company: "", // honeypot
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const validate = (data: FormData) => {
    const e: Partial<FormData> = {};
    if (!data.name.trim()) e.name = "Le nom est requis.";
    if (!data.email.trim()) e.email = "L’email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Email invalide.";
    if (!data.subject.trim()) e.subject = "Le sujet est requis.";
    if (!data.message.trim() || data.message.trim().length < 10) e.message = "Le message doit contenir au moins 10 caractères.";
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // anti-bot simple
    if (formData.company) return;

    const v = validate(formData);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    try {
      setIsSubmitting(true);
      // 👉 place ici ton appel API (send email / server action)
      // await fetch("/api/contact", { method: "POST", body: JSON.stringify(formData) });

      // simulate
      await new Promise((r) => setTimeout(r, 700));

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "", company: "" });
    } catch (err) {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#FFF1E8" }} className="min-h-screen">
      {/* =========================
          HERO PARALLAX (mêmes couleurs & dégradé)
      ========================== */}
      <header className="relative h-[60vh] overflow-hidden">
        <div ref={parallaxRef} className="absolute inset-0 w-full h-[120%] -top-[10%] z-0">
          <Image
            src="/immg.png"
            alt="Image parallax contact"
            fill
            className="object-cover"
            priority
          />
          {/* ⚠️ même gradient noir que ton code */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#F16462]">
              Contactez-nous
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Nous sommes là pour vous aider à planifier votre événement parfait
            </p>
          </motion.div>
        </div>
      </header>

      <main className="py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* =========================
              COLONNE GAUCHE : Infos
          ========================== */}
          <aside className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold text-[#3A3A3A]">
                Parlons de votre projet
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Notre équipe d&apos;experts vous accompagne dans la planification de vos événements
                personnels et familiaux. Dites-nous ce dont vous avez besoin.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
              {/* Email */}
              <motion.a
                href="mailto:contact@monasabet.com"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative block bg-gradient-to-br from-[#F16462]/10 to-[#F16462]/5 p-6 rounded-2xl border border-[#F16462]/20 hover:border-[#F16462]/40 transition-all hover:shadow-xl hover:shadow-[#F16462]/15"
                aria-label="Envoyer un email à contact@monasabet.com"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F16462] to-[#F16462]/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiMail className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#F16462] transition-colors">
                      Email
                    </h3>
                    <p className="text-gray-700 font-medium">contact@monasabet.com</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F16462]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>

              {/* Téléphone */}
              <motion.a
                href="tel:+21600000000"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative block bg-gradient-to-br from-[#1BA3A9]/10 to-[#1BA3A9]/5 p-6 rounded-2xl border border-[#1BA3A9]/20 hover:border-[#1BA3A9]/40 transition-all hover:shadow-xl hover:shadow-[#1BA3A9]/15"
                aria-label="Appeler le numéro de téléphone"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1BA3A9] to-[#1BA3A9]/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiPhone className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#1BA3A9] transition-colors">
                      Téléphone
                    </h3>
                    <p className="text-gray-700 font-medium">+216 XX XXX XXX</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1BA3A9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>

              {/* Adresse */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative bg-gradient-to-br from-[#F16462]/10 to-[#F16462]/5 p-6 rounded-2xl border border-[#F16462]/20 hover:border-[#F16462]/40 transition-all hover:shadow-xl hover:shadow-[#F16462]/15"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F16462] to-[#F16462]/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiMapPin className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#F16462] transition-colors">
                      Adresse
                    </h3>
                    <p className="text-gray-700 font-medium">Tunis, Tunisie</p>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F16462]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </div>
          </aside>

          {/* =========================
              COLONNE DROITE : Formulaire
          ========================== */}
          <section className="lg:col-span-3">
            {/* alert banner */}
            <div className="min-h-0 mb-4" aria-live="polite" aria-atomic="true">
              {status === "success" && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  <FiCheckCircle className="shrink-0" />
                  <p>Merci pour votre message ! Nous vous répondrons bientôt.</p>
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  <FiAlertCircle className="shrink-0" />
                  <p>Une erreur est survenue. Veuillez réessayer.</p>
                </div>
              )}
            </div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-white/60"
              noValidate
              aria-describedby="form-help"
            >
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-6">
                Envoyez-nous un message
              </h2>

              {/* Honeypot */}
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "error-name" : undefined}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800 ${
                      errors.name ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder="Votre nom"
                    required
                  />
                  {errors.name && (
                    <p id="error-name" className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "error-email" : undefined}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800 ${
                      errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder="votre@email.com"
                    required
                  />
                  {errors.email && (
                    <p id="error-email" className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-800 mb-2">
                  Sujet
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? "error-subject" : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition text-gray-800 ${
                    errors.subject ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder="Sujet de votre message"
                  required
                />
                {errors.subject && (
                  <p id="error-subject" className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "error-message" : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F16462] focus:border-transparent transition resize-none text-gray-800 ${
                    errors.message ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder="Décrivez votre projet ou posez votre question…"
                  required
                />
                {errors.message && (
                  <p id="error-message" className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              <p id="form-help" className="sr-only">
                Tous les champs sont requis. Les erreurs s’affichent sous les champs concernés.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full bg-gradient-to-r from-[#F16462] to-[#1BA3A9] text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                aria-busy={isSubmitting}
              >
                <FiSend />
                {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
              </button>
            </motion.form>
          </section>
        </div>
      </main>

      {/* =========================
          FAQ (couleurs inchangées)
      ========================== */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#3A3A3A] mb-3">Questions fréquentes</h2>
            <p className="text-lg text-gray-700">Trouvez rapidement les réponses à vos questions</p>
          </motion.div>

          <div className="space-y-6">
            <details className="bg-[#FFF6F6] p-6 rounded-lg group">
              <summary className="font-semibold text-[#3A3A3A] cursor-pointer list-none flex items-center justify-between">
                <span>Comment réserver un prestataire ?</span>
                <span className="transition group-open:rotate-45">+</span>
              </summary>
              <p className="text-gray-700 mt-3">
                Utilisez notre moteur de recherche pour trouver des prestataires dans votre région,
                consultez leurs profils et contactez-les directement via notre plateforme.
              </p>
            </details>

            <details className="bg-[#FFF6F6] p-6 rounded-lg group">
              <summary className="font-semibold text-[#3A3A3A] cursor-pointer list-none flex items-center justify-between">
                <span>Y a-t-il des frais pour utiliser Monasabet ?</span>
                <span className="transition group-open:rotate-45">+</span>
              </summary>
              <p className="text-gray-700 mt-3">
                La recherche et la consultation des profils sont entièrement gratuites.
                Seuls les prestataires paient des frais d&apos;abonnement pour être référencés.
              </p>
            </details>

            <details className="bg-[#FFF6F6] p-6 rounded-lg group">
              <summary className="font-semibold text-[#3A3A3A] cursor-pointer list-none flex items-center justify-between">
                <span>Comment devenir prestataire partenaire ?</span>
                <span className="transition group-open:rotate-45">+</span>
              </summary>
              <p className="text-gray-700 mt-3">
                Contactez-nous via ce formulaire en précisant &quot;Partenariat prestataire&quot; dans le sujet.
                Notre équipe vous expliquera le processus d&apos;inscription.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
