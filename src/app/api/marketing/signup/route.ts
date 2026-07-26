import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { marketingSignupSchema } from "@/lib/marketing";
import { signMarketingConfirmToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/send-email";
import { marketingConfirmEmail } from "@/lib/emails";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Hold mig orienteret"-tilmelding (dobbelt opt-in). Offentligt endpoint, saa det
// er rate-limitet pr. IP for at undgaa mail-bombning. Selve samtykket er foerst
// aktivt, naar bekraeftelseslinket i mailen er klikket (se /api/marketing/confirm).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  }

  const parsed = marketingSignupSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Tjek felterne og prøv igen.";
    return apiError("INVALID", msg, 400);
  }
  const { email, source } = parsed.data;
  // Tomme valgfrie felter gemmes som null, ikke "".
  const name = parsed.data.name?.trim() || null;
  const storeName = parsed.data.storeName?.trim() || null;

  // Misbrugsvaern: hver bekraeftelses-mail koster en Resend-afsendelse, saa loft
  // pr. IP (DB-backet, saa det holder selv uden Redis). Legitime brugere rammer
  // det aldrig; kun mange fra samme enhed paa kort tid stoppes.
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("marketing-signup", ip, 5, 3600))) {
    return apiError(
      "RATE_LIMIT",
      "For mange forsøg. Prøv igen om lidt.",
      429,
    );
  }

  const existing = await prisma.marketingSignup.findUnique({
    where: { email },
    select: { id: true, confirmedAt: true },
  });

  // Allerede bekraeftet: sig pænt tak, uden at sende en ny bekraeftelses-mail
  // eller nulstille samtykke-dokumentationen.
  if (existing?.confirmedAt) {
    return Response.json({ ok: true, already: true });
  }

  let signupId: string;
  if (existing) {
    // Ubekraeftet gentilmelding: opdater felterne og send bekraeftelsen igen.
    await prisma.marketingSignup.update({
      where: { id: existing.id },
      data: { name, storeName, source, signedUpAt: new Date() },
    });
    signupId = existing.id;
  } else {
    const created = await prisma.marketingSignup.create({
      data: { email, name, storeName, source },
      select: { id: true },
    });
    signupId = created.id;
  }

  // Bekraeftelses-mail (dobbelt opt-in). Fejler afsendelsen (fx Resend nede),
  // beholdes raekken, saa et nyt forsoeg bare sender igen; vi vaelter ikke svaret.
  try {
    const token = await signMarketingConfirmToken(signupId);
    const url = `${APP_URL}/api/marketing/confirm?token=${encodeURIComponent(token)}`;
    const mail = marketingConfirmEmail(url);
    await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (e) {
    console.error("Bekraeftelses-mail fejlede:", e);
  }

  return Response.json({ ok: true });
}
