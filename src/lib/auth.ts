import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { env } from './env';


export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    // 1. Standard Credentials Login (Email + Password)
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please fill in both email and password.');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) {
          throw new Error('No account found with this email. Please sign up first.');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error('Incorrect password. Please try again.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),

    // 2. Developer Sandbox Bypass (Only in development)
    CredentialsProvider({
      id: 'sandbox',
      name: 'Developer Sandbox',
      credentials: {
        email: { label: 'Sandbox Email', type: 'email' },
        name: { label: 'Sandbox Name', type: 'text' },
      },
      async authorize(credentials) {
        // Enforce sandbox block in production environments
        if (env.NODE_ENV === 'production') {
          throw new Error('Sandbox login is disabled in production.');
        }

        if (!credentials?.email) {
          throw new Error('Sandbox email is required.');
        }

        const email = credentials.email.toLowerCase().trim();
        const name = credentials.name?.trim() || 'Sandbox Explorer';

        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.provider = 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (!session.user) {
          session.user = {
            name: token.name,
            email: token.email,
          };
        }
        (session.user as any).id = token.id as string;
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: env.NEXTAUTH_SECRET,
};
