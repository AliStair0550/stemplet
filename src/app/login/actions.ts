"use server";

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validation";
import { durableRateLimit } from "@/lib/rate-limit";

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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      notFound: true,
      error:
        "Vi kan ikke finde en konto med den e-mail. Har du oprettet din butik endnu?",
    };
  }

  // signIn sender magic link og redirecter til /login/tjek-mail.
  await signIn("resend", { email, redirectTo: "/app" });
  return {};
}
