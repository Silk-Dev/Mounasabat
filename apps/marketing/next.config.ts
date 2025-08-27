import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Désactive l'optimisation d'images pour les fichiers locaux
  },
  // Configuration pour le chargement des fichiers statiques
  experimental: {
    // Configuration expérimentale si nécessaire
  },
  // Configuration pour le dossier public
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
  // Configuration expérimentale désactivée pour le moment
  // experimental: {
  //   serverActions: true,
  // },
};

export default nextConfig;
