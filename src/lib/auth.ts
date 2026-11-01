import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { folkaSender, loginEmail, staffLoginEmail, welcomeEmail } from "./emails";
import { isSuperadminEmail } from "./superadmin-emails";
import { DEMO_SLUG } from "./demo";
import { verifyOnboardingToken } from "./onboarding-token";
import { generateLoginCode, LOGIN_CODE_TTL_SECONDS } from "./login-code";

// Auth.js med magic link via Resend. Kun virksomheder logger ind.
// Kunder logger ALDRIG ind - de identificeres via device-cookie og serial.

const baseAdapter = PrismaAdapter(prisma);

// Bloker selvbetjent oprettelse: brugere oprettes kun via onboarding (/start).
// Et magisk link til en ukendt e-mail giver dermed ingen konto. Undtagelse:
// superadmin (fx hej@folka.dk), som ikke har en butik, oprettes ved foerste login.
// En bruger skal (legacy) hoere til en butik. Superadmin knyttes til demo-
// butikken (din egen, bag "Proev det selv"), eller en intern, stoppet butik,
// hvis demoen ikke findes. Superadmin lander alligevel i /admin.
async function createSuperadminUser(user: { email: string; emailVerified: Date | null; name?: string | null; image?: string | null }) {
  const home =
    (await prisma.business.findUnique({ where: { slug: DEMO_SLUG }, select: { id: true } })) ??
    (await prisma.business.upsert({
      where: { slug: "alius-intern" },
      update: {},
      create: { name: "Folka (intern)", slug: "alius-intern", stopped: true, stampsEnabled: false },
      select: { id: true },
    }));
  return prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name ?? null,
        image: user.image ?? null,
        businessId: home.id,
      },
    });
    await tx.membership.create({ data: { userId: u.id, businessId: home.id } });
    return u;
  });
}

const adapter = {
  ...baseAdapter,
  createUser: async (user: Parameters<NonNullable<typeof baseAdapter.createUser>>[0]) => {
    if (isSuperadminEmail(user.email)) return createSuperadminUser(user);
    throw new Error(
      "Selvbetjent oprettelse er slået fra. Opret din virksomhed på /start.",
    );
  },
};

// Velkomstmailen (i stedet for login-mailen) sendes kun i den foerste tid efter
// oprettelsen.
const WELCOME_WINDOW_MS = 24 * 60 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "Stemplet <login@folka.dk>",
      name: "E-mail",
      // Token'et er en 6-cifret kode, der baade sidder i linket og kan skrives
      // ind paa "Tjek din mail" (se login-code.ts). Kort levetid, fordi koden er
      // kort.
      maxAge: LOGIN_CODE_TTL_SECONDS,
      generateVerificationToken: generateLoginCode,
      // Vi sender ALTID vores egen brandede mail (Folka, se emails.ts).
      // Uden Resend-noegle (lokal udvikling) logges linket i terminalen.
      sendVerificationRequest: async ({
        identifier,
        url,
        token,
        provider,
      }: {
        identifier: string;
        url: string;
        token: string;
        provider: { apiKey?: string; from?: string };
      }) => {
        const apiKey = provider.apiKey;
        if (!apiKey) {
          // Aldrig i produktion: log ikke login-links, fejl hoejlydt i stedet.
          if (process.env.NODE_ENV === "production") {
            throw new Error("AUTH_RESEND_KEY mangler i produktion.");
          }
          console.log(`\n🔗 Login til ${identifier}: kode ${token}\n${url}\n`);
          return;
        }
        // Foerste login efter oprettelse (emailVerified == null) faar en
        // velkomstmail; alle senere logins faar den korte login-mail. Begge
        // baerer det SAMME magiske link, saa det er stadig eet klik.
        let firstTime = false;
        // Medarbejder uden ejer-adgang: mailen handler om kassen, ikke dashboardet.
        let staffShop: string | null = null;
        try {
          const u = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() },
            select: {
              emailVerified: true,
              business: { select: { createdAt: true } },
              memberships: { select: { role: true, business: { select: { name: true } } } },
            },
          });
          if (u && u.memberships.length > 0 && u.memberships.every((m) => m.role === "STAFF")) {
            staffShop = u.memberships[0].business.name;
          }
          // Kun lige efter oprettelsen: auto-login fra /start saetter ikke
          // emailVerified, saa uden tidsgraensen fik ejeren velkomsten igen ved
          // naeste login.
          const fresh = !!u && Date.now() - u.business.createdAt.getTime() < WELCOME_WINDOW_MS;
          firstTime = !!u && u.emailVerified === null && fresh;
        } catch {
          // DB-blip: fald tilbage til den almindelige login-mail.
        }
        const mail = staffShop
          ? staffLoginEmail(url, token, staffShop)
          : firstTime
            ? welcomeEmail(url, token)
            : loginEmail(url, token);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            // Login er faelles for Folkas produkter: afsendernavnet er altid
            // "Folka", uanset navnet i EMAIL_FROM (adressen genbruges).
            from: folkaSender(provider.from),
            to: identifier,
            subject: mail.subject,
            html: mail.html,
            text: mail.text,
            attachments: mail.attachments,
          }),
          // Haenger Resend, maa login-hjulet ikke dreje, til funktionen doer.
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Resend-fejl (${res.status}): ${detail}`);
        }
      },
    }),
    // Auto-login direkte efter oprettelse: success-skaermen paa /start sender et
    // kortlivet, signeret token, saa den nye ejer kommer direkte ind i dashboardet
    // uden foerst at aabne login-mailen. Token'et kan kun logge den bruger ind,
    // det blev udstedt til, og udloeber efter faa minutter.
    Credentials({
      id: "onboarding",
      name: "Onboarding",
      credentials: { token: {} },
      authorize: async (creds) => {
        const token = typeof creds?.token === "string" ? creds.token : "";
        const payload = verifyOnboardingToken(token);
        if (!payload) return null;
        const user = await prisma.user.findUnique({
          where: { id: payload.uid },
          select: { id: true, email: true },
        });
        return user ? { id: user.id, email: user.email } : null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/tjek-mail",
    error: "/login",
  },
  callbacks: {
    // Tillad kun eksisterende virksomhedsbrugere at logge ind, samt superadmin
    // (fx hej@folka.dk), der ikke behoever en butik; brugeren oprettes da ved
    // foerste login.
    async signIn({ user }) {
      if (!user?.email) return false;
      if (isSuperadminEmail(user.email)) return true;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      return Boolean(existing);
    },
    async jwt({ token }) {
      // Token'et baerer kun bruger-id (uid). Den AKTIVE butik ligger i en cookie
      // og verificeres mod Membership ved hver forespoergsel (se lib/session),
      // saa en bruger kan skifte mellem sine butikker uden nyt login.
      if (!token.uid && (token.email || token.sub)) {
        const u = token.email
          ? await prisma.user.findUnique({
              where: { email: token.email },
              select: { id: true },
            })
          : await prisma.user.findUnique({
              where: { id: token.sub as string },
              select: { id: true },
            });
        if (u) token.uid = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
      }
      return session;
    },
  },
});
