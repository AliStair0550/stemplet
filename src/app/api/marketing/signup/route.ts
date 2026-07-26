import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { marketingSignupSchema, marketingSourceLabel } from "@/lib/marketing";
import { sendEmail } from "@/lib/send-email";
import {
  marketingWelcomeEmail,
  superadminMarketingSignupEmail,
} from "@/lib/emails";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Hold mig orienteret"-tilmelding (single opt-in). Tilmeldingen er aktiv med det
// samme: samtykket dokumenteres med tidsstempel + IP ved selve tilmeldingen. En
// kort velkomstmail sendes (ingen handling kraevet), og superadmin notificeres.
// Offentligt endpoint, saa det er rate-limitet pr. IP mod misbrug.
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

  // Misbrugsvaern: hver tilmelding koster en Resend-afsendelse, saa loft pr. IP
  // (DB-backet, saa det holder selv uden Redis).
  const ip = clientIp(req);
  if (!(await durableRateLimit("marketing-signup", ip ?? "ukendt", 5, 3600))) {
    return apiError("RATE_LIMIT", "For mange forsøg. Prøv igen om lidt.", 429);
  }

  const existing = await prisma.marketingSignup.findUnique({
    where: { email },
    select: { id: true, confirmedAt: true },
  });

  // Allerede skrevet op: sig pænt tak igen, uden ny mail eller notifikation, og
  // uden at roere den oprindelige samtykke-dokumentation.
  if (existing?.confirmedAt) {
    return Response.json({ ok: true, already: true });
  }

  const now = new Date();
  if (existing) {
    // Ubekraeftet legacy-raekke: aktiver den nu.
    await prisma.marketingSignup.update({
      where: { id: existing.id },
      data: { name, storeName, source, signedUpAt: now, confirmedAt: now, confirmIp: ip },
    });
  } else {
    await prisma.marketingSignup.create({
      data: { email, name, storeName, source, confirmedAt: now, confirmIp: ip },
    });
  }

  // Velkomstmail til tilmelderen (best-effort: en mail-fejl vaelter ikke svaret).
  try {
    const mail = marketingWelcomeEmail(name);
    await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (e) {
    console.error("Velkomstmail fejlede:", e);
  }

  // Notifikation til superadmin (Ali).
  try {
    const recipients = superadminRecipients();
    if (recipients.length > 0) {
      const mail = superadminMarketingSignupEmail({
        name: name || "(ingen)",
        storeName: storeName || "(ingen)",
        email,
        source: marketingSourceLabel(source),
        adminUrl: `${APP_URL}/admin/marketing`,
      });
      await sendEmail({
        to: recipients.join(","),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    }
  } catch (e) {
    console.error("Marketing-notifikation fejlede:", e);
  }

  return Response.json({ ok: true });
}
