import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { resolveOrCreateCard } from "@/lib/claim";
import { parseContact } from "@/lib/contact";
import { maybeFireCardholderThresholds } from "@/lib/billing";
import {
  cardCookieName,
  cardCookieOptions,
  DEVICE_ID_COOKIE,
  deviceCookieOptions,
} from "@/lib/cookies";
import { newDeviceId } from "@/lib/ids";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Trin 1 af "Hent mit stempelkort": kunden skriver navn og e-mail (og kan sige ja
// tak til nyheder). Her oprettes kortet, og kort- og enheds-cookien saettes.
// Trin 2 er det uaendrede, rigtige link til /api/wallet/claim/[slug], som nu
// genfinder kortet og aabner Apple Wallet fra kundens eget tryk.

const bodySchema = z.object({
  // Rummelige lofter her; de rigtige graenser (og beskeder) ligger i parseContact.
  name: z.string().max(400),
  email: z.string().max(1000),
  consent: z.boolean().optional(),
});

// Fejl i selve formularen vises ved felterne; resten (lukket, fuld, ...) bruger
// /k-sidens faste fejlbeskeder.
const MESSAGES: Record<string, string> = {
  navn: "Skriv dit navn.",
  mail: "Skriv en gyldig e-mailadresse.",
  mail_findes: "E-mailen er allerede brugt til et kort hos butikken. Spørg personalet.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "serverfejl" });
  }
  const contact = parseContact(parsed.data);
  if (!contact.ok) {
    return NextResponse.json({ ok: false, code: contact.error, message: MESSAGES[contact.error] });
  }

  // Samme generoese loft pr. IP som claim-linket (travl cafe paa een WiFi).
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("claim-contact-ip", ip, 200, 3600).catch(() => true))) {
    return NextResponse.json({ ok: false, code: "optaget" });
  }

  const jar = await cookies();
  const existingDid = jar.get(DEVICE_ID_COOKIE)?.value;
  const deviceId = existingDid ?? newDeviceId();

  let r;
  try {
    r = await resolveOrCreateCard(slug, deviceId, contact.contact);
  } catch (e) {
    captureServerError(e, { route: "wallet:claim:kontakt", extra: { slug } });
    return NextResponse.json({ ok: false, code: "serverfejl" });
  }

  const out = r.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, code: r.error, message: MESSAGES[r.error] });
  if (!existingDid) out.cookies.set(DEVICE_ID_COOKIE, deviceId, deviceCookieOptions());
  if (r.ok) {
    out.cookies.set(cardCookieName(r.businessId), r.authToken, cardCookieOptions());
    // Kun ved et NYT kort kan en taerskel (80/100) vaere krydset.
    if (r.created) await maybeFireCardholderThresholds(r.businessId);
  }
  return out;
}
