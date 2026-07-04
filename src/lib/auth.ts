import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

// Auth.js med magic link via Resend. Kun virksomheder logger ind.
// Kunder logger ALDRIG ind - de identificeres via device-cookie og serial.

const baseAdapter = PrismaAdapter(prisma);

// Bloker selvbetjent oprettelse: brugere oprettes kun via onboarding (/start).
// Et magisk link til en ukendt e-mail giver dermed ingen konto.
const adapter = {
  ...baseAdapter,
  createUser: async () => {
    throw new Error(
      "Selvbetjent oprettelse er slaaet fra. Opret din virksomhed paa /start.",
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
      // Dev-hjaelp: uden Resend-noegle logges login-linket i terminalen,
      // saa man kan logge ind lokalt. I produktion sendes en rigtig mail.
      ...(!process.env.AUTH_RESEND_KEY && process.env.NODE_ENV !== "production"
        ? {
            sendVerificationRequest: async ({
              identifier,
              url,
            }: {
              identifier: string;
              url: string;
            }) => {
              console.log(
                `\n🔗 Login-link til ${identifier}:\n${url}\n`,
              );
            },
          }
        : {}),
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
