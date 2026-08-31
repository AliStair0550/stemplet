import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { startRequestSchema } from "@/lib/start-request-schema";
import { sendEmail } from "@/lib/send-email";
import { superadminSignupRequestEmail } from "@/lib/emails";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Oprettelsesanmodning: en butik udfylder en kort formular (virksomhed, oensket
// beloenning, kontakt). Vi gemmer den og notificerer superadmin (Ali), som laver
// et udkast og gaar i dialog. Ingen konto oprettes. Offentligt endpoint, saa det
// er rate-limitet pr. IP mod misbrug.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  }

  const parsed = startRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Tjek felterne og prøv igen.";
    return apiError("INVALID", msg, 400);
  }
  const { businessName, reward, email } = parsed.data;
  const contactName = parsed.data.contactName?.trim() || null;
  const phone = parsed.data.phone?.trim() || null;

  // Misbrugsvaern: hver anmodning koster en Resend-afsendelse, saa loft pr. IP.
  const ip = clientIp(req);
  if (!(await durableRateLimit("start-request", ip ?? "ukendt", 5, 3600))) {
    return apiError("RATE_LIMIT", "For mange forsøg. Prøv igen om lidt.", 429);
  }

  await prisma.signupRequest.create({
    data: { businessName, reward, contactName, email, phone, createdIp: ip },
  });

  // Notifikation til superadmin (Ali). Best-effort: en mail-fejl vaelter ikke
  // svaret, for anmodningen er allerede gemt.
  try {
    const recipients = superadminRecipients();
    if (recipients.length > 0) {
      const mail = superadminSignupRequestEmail({
        businessName,
        reward,
        contactName: contactName || "(ingen)",
        email,
        phone: phone || "(ingen)",
        createUrl: `${APP_URL}/app/ny-butik`,
      });
      await sendEmail({
        to: recipients.join(","),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    }
  } catch (e) {
    console.error("Oprettelsesanmodning-notifikation fejlede:", e);
  }

  return Response.json({ ok: true });
}
