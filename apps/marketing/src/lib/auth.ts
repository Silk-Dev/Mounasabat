import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma';
import { compare } from 'bcryptjs';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: User & {
      role: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
  }
}

// @ts-ignore - Fix for Prisma Adapter type issue
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt', // Use JWT strategy for better security
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login/verify-request'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
          include: {
            provider: true,
            admin: true
          }
        });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        // Type assertion to include password in the user object
        const userWithPassword = user as (typeof user & { password?: string });

        if (!userWithPassword.password) {
          throw new Error('Email ou mot de passe incorrect');
        }

        const isPasswordValid = await compare(
          String(credentials.password), 
          userWithPassword.password
        );

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        return {
          id: userWithPassword.id,
          email: userWithPassword.email,
          name: userWithPassword.name,
          role: userWithPassword.role || 'USER',
          image: null, // Remove the image property since it's not in our User model
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
};

export { getServerSession } from 'next-auth';
export { default as auth } from 'next-auth';
