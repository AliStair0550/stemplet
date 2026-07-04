"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/validation";

export type LoginState = { error?: string };

export async function requestMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Skriv en gyldig e-mail." };
  }
  const email = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      error:
        "Vi kan ikke finde en konto med den e-mail. Opret din virksomhed paa /start.",
    };
  }

  // signIn sender magic link og redirecter til /login/tjek-mail.
  await signIn("resend", { email, redirectTo: "/app" });
  return {};
}
