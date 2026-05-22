import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import bcrypt from 'bcryptjs';
import { sqlite } from './db/index';

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Email + password ──────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(credentials.email) as any;
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch {
          return null;
        }
      },
    }),

    // ── Google OAuth ──────────────────────────────────────────────────────
    // Setup: console.cloud.google.com → APIs → Credentials → OAuth 2.0 Client
    // Add to .env.local: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    // Authorised redirect URI: https://yourdomain.com/api/auth/callback/google
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              scope: [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.readonly',
              ].join(' '),
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })]
      : []),

    // ── Apple Sign In ─────────────────────────────────────────────────────
    // Setup: developer.apple.com → Certificates → Identifiers → Service IDs
    // Add to .env.local: APPLE_ID, APPLE_SECRET (private key as string), APPLE_TEAM_ID, APPLE_KEY_ID
    // Docs: https://next-auth.js.org/providers/apple
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [AppleProvider({
          clientId: process.env.APPLE_ID,
          clientSecret: process.env.APPLE_SECRET,
        })]
      : []),
  ],

  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'member';
      }
      // Store OAuth access token so connectors can call Gmail / Calendar APIs
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Auto-create a user record on first Google / Apple sign-in
      if ((account?.provider === 'google' || account?.provider === 'apple') && user.email) {
        try {
          const existing = sqlite.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
          if (!existing) {
            const { v4: uuid } = await import('uuid');
            sqlite.prepare(
              'INSERT OR IGNORE INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
            ).run(uuid(), user.email, user.name ?? user.email, 'member');
          }
        } catch (e) {
          console.error('OAuth auto-create user error:', e);
        }
      }
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || 'stu-legal-dev-secret-change-in-production',
};
