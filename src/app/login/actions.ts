"use server";

import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/redis";

export type LoginState = { error?: string; notFound?: boolean };

async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "ukendt";
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
  // 10/time pr. IP. Fail-open hvis Redis ikke svarer.
  const ip = await clientIpFromHeaders();
  const [emailOk, ipOk] = await Promise.all([
    checkRateLimit("login-email", 3, "1 h", email),
    checkRateLimit("login-ip", 10, "1 h", ip),
  ]);
  if (!emailOk || !ipOk) {
    return {
      error:
        "Du har bedt om mange links på kort tid. Vent lidt, og tjek din indbakke — også spam.",
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
