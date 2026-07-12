import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { loginEmail } from "./emails";

// Auth.js med magic link via Resend. Kun virksomheder logger ind.
// Kunder logger ALDRIG ind - de identificeres via device-cookie og serial.

const baseAdapter = PrismaAdapter(prisma);

// Bloker selvbetjent oprettelse: brugere oprettes kun via onboarding (/start).
// Et magisk link til en ukendt e-mail giver dermed ingen konto.
const adapter = {
  ...baseAdapter,
  createUser: async () => {
    throw new Error(
      "Selvbetjent oprettelse er slået fra. Opret din virksomhed på /start.",
    );
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "Stemplet <login@stemplet.alius.dk>",
      name: "E-mail",
      // Vi sender ALTID vores egen brandede mail (Stemplets tone og stil).
      // Uden Resend-noegle (lokal udvikling) logges linket i terminalen.
      sendVerificationRequest: async ({
        identifier,
        url,
        provider,
      }: {
        identifier: string;
        url: string;
        provider: { apiKey?: string; from?: string };
      }) => {
        const apiKey = provider.apiKey;
        if (!apiKey) {
          // Aldrig i produktion: log ikke login-links, fejl hoejlydt i stedet.
          if (process.env.NODE_ENV === "production") {
            throw new Error("AUTH_RESEND_KEY mangler i produktion.");
          }
          console.log(`\n🔗 Login-link til ${identifier}:\n${url}\n`);
          return;
        }
        const mail = loginEmail(url);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Resend-fejl (${res.status}): ${detail}`);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/tjek-mail",
    error: "/login",
  },
  callbacks: {
    // Tillad kun eksisterende virksomhedsbrugere at logge ind.
    async signIn({ user }) {
      if (!user?.email) return false;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      return Boolean(existing);
    },
    async jwt({ token }) {
      if (token.email && !token.businessId) {
        const u = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, businessId: true },
        });
        if (u) {
          token.uid = u.id;
          token.businessId = u.businessId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.businessId = token.businessId as string | undefined;
      }
      return session;
    },
  },
});
