import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/http";
import { verifyMarketingConfirmToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/send-email";
import { superadminMarketingSignupEmail } from "@/lib/emails";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { marketingSourceLabel } from "@/lib/marketing";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bekraeftelses-link fra "hold mig orienteret"-mailen. Ved klik: saet confirmedAt
// + IP (samtykkedokumentation) og notificer superadmin. Idempotent: et gentaget
// klik bekraefter bare igen paa kvitteringssiden uden at sende en ny notifikation.
function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, APP_URL));
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirectTo("/tilmelding/bekraeftet?fejl=1");

  let signupId: string;
  try {
    signupId = await verifyMarketingConfirmToken(token);
  } catch {
    return redirectTo("/tilmelding/bekraeftet?fejl=1");
  }

  const signup = await prisma.marketingSignup.findUnique({
    where: { id: signupId },
  });
  if (!signup) return redirectTo("/tilmelding/bekraeftet?fejl=1");

  // Allerede bekraeftet: bare send til kvitteringen (ingen ny notifikation).
  if (signup.confirmedAt) return redirectTo("/tilmelding/bekraeftet");

  await prisma.marketingSignup.update({
    where: { id: signup.id },
    data: { confirmedAt: new Date(), confirmIp: clientIp(req) },
  });

  // Notifikation til superadmin (Ali). Fejler den, er bekraeftelsen alligevel
  // gemt, saa vi vaelter ikke kvitteringen paa en mail-fejl.
  try {
    const recipients = superadminRecipients();
    if (recipients.length > 0) {
      const mail = superadminMarketingSignupEmail({
        name: signup.name || "(ingen)",
        storeName: signup.storeName || "(ingen)",
        email: signup.email,
        source: marketingSourceLabel(signup.source),
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

  return redirectTo("/tilmelding/bekraeftet");
}
