/**
 * Auth.js (next-auth v5) configuration
 *
 * Import `auth`, `signIn`, `signOut`, and `handlers` from this file throughout
 * the app — never from "next-auth" directly — so the shared session/config is
 * always the same instance.
 *
 *   Server component:  const session = await auth()
 *   Server action:     await signIn("github")
 *   Route handler:     export { handlers as GET, handlers as POST }
 */

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // ── OAuth providers ────────────────────────────────────────────────────────
  // Add GITHUB_ID / GITHUB_SECRET  or  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  // to .env to enable the respective provider.
  providers: [
    GitHub,
    Google,
  ],

  // ── Session strategy ───────────────────────────────────────────────────────
  // Default with a DB adapter is "database" (server-side sessions).
  // Switch to "jwt" if you prefer stateless tokens.
  session: { strategy: "database" },

  // ── Callbacks ──────────────────────────────────────────────────────────────
  callbacks: {
    /** Expose userId on the session object so server components can read it. */
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  // ── Pages ──────────────────────────────────────────────────────────────────
  pages: { signIn: "/auth/sign-in" },
});
