"use server";

import { cookies, headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validation";
import { durableRateLimit } from "@/lib/rate-limit";
import { isSuperadminEmail } from "@/lib/superadmin-emails";
import { LOGIN_CODE_TTL_SECONDS, LOGIN_EMAIL_COOKIE } from "@/lib/login-code";
import { captureServerError } from "@/lib/sentry";

export type LoginState = { error?: string; notFound?: boolean };

async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  // x-real-ip saettes af Vercel og kan ikke spoofes; foretraek den.
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "ukendt"
  );
}

export async function requestMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Skriv en gyldig e-mail." };
  }
  const email = parsed.data.toLowerCase();

  // Alle databaseafhaengige trin (rate-limit, brugeropslag, magic-link) er samlet
  // i eet try/catch. Et forbigaaende blip, fx Neon-compute der lige er vaagnet fra
  // dvale, giver saa en rolig "prøv igen"-besked i stedet for den generiske
  // fejlside. Succes-redirect fra signIn kastes som en fejl og SKAL boble op
  // (unstable_rethrow foerst i catch).
  try {
    // Bremser email-bombning og bruteforce-optaelling: 3 mails/time pr. e-mail,
    // 10/time pr. IP. DB-backet (fail-closed), saa graensen ogsaa gaelder hvis
    // Redis er nede.
    const ip = await clientIpFromHeaders();
    const [emailOk, ipOk] = await Promise.all([
      durableRateLimit("login-email", email, 3, 3600),
      durableRateLimit("login-ip", ip, 10, 3600),
    ]);
    if (!emailOk || !ipOk) {
      return {
        error:
          "Du har bedt om mange links på kort tid. Vent lidt, og tjek din indbakke, også spam.",
      };
    }

    // Superadmin (fx hej@folka.dk) kan altid logge ind, ogsaa uden butik; Auth.js
    // opretter brugeren ved foerste login. Alle andre skal have en konto.
    const superadmin = isSuperadminEmail(email);
    const user = superadmin ? null : await prisma.user.findUnique({ where: { email } });
    if (!superadmin && !user) {
      return {
        notFound: true,
        error:
          "Vi kan ikke finde en konto med den e-mail. Har du oprettet din butik endnu?",
      };
    }

    // "Tjek din mail" skal vide, hvem koden hoerer til (koden er kun gyldig
    // sammen med e-mailen). Lever lige saa laenge som koden.
    (await cookies()).set(LOGIN_EMAIL_COOKIE, email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LOGIN_CODE_TTL_SECONDS,
    });

    // signIn sender magic link og redirecter til /app ved succes (den redirect
    // boble op via unstable_rethrow nedenfor).
    await signIn("resend", { email, redirectTo: superadmin ? "/admin" : "/app" });
    return {};
  } catch (e) {
    unstable_rethrow(e); // lad redirect (succes) passere
    console.error("Login fejlede:", e);
    // Fejler login-mailen (Resend nede, noeglen udloebet), kan ingen ejer logge
    // ind. Det skal vi se med det samme.
    captureServerError(e, { route: "login" });
    return {
      error:
        "Vi kunne ikke logge dig ind lige nu. Det er som regel forbigående, prøv igen om et øjeblik.",
    };
  }
}
