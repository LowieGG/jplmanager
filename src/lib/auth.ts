// src/lib/auth.ts
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';

// TypeScript type extensions - dit is wat ontbrak!
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  
  interface JWT {
    id: string;
  }
  
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Inloggen met email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }
 
          await connectDB();
          const user = await User.findOne({ email: credentials.email });
                     
          if (!user) {
            console.log('User not found');
            return null;
          }
 
          const isCorrect = await bcrypt.compare(credentials.password, user.password);
                     
          if (!isCorrect) {
            console.log('Invalid password');
            return null;
          }
 
          console.log('User authenticated successfully');
          return {
             id: user._id.toString(),
             name: user.name,
             email: user.email
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};