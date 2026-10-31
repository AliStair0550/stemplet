import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { signupForReferrals } from "@/lib/referral-signup";
import {
  cardCookieName,
  cardCookieOptions,
  DEVICE_ID_COOKIE,
  deviceCookieOptions,
} from "@/lib/cookies";
import { newDeviceId } from "@/lib/ids";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // Rummelige lofter; de rigtige graenser (og beskeder) ligger i parseContact.
  name: z.string().max(400),
  email: z.string().max(1000),
  consent: z.boolean().optional(),
  code: z.string().max(20).optional().nullable(),
  source: z.enum(["LINK", "CODE_ENTERED"]).optional(),
});

// Fejl-koder fra tilmeldingen oversat til en rolig besked til kunden.
const MESSAGES: Record<string, string> = {
  navn: "Skriv dit navn.",
  mail: "Skriv en gyldig e-mailadresse.",
  mail_findes: "Der er allerede et kort med den e-mail. Vi kan sende et link, så du kan gendanne det.",
  lukket: "Henvisninger er ikke åbne hos butikken lige nu.",
  pause: "Butikken tager ikke imod nye kunder lige nu. Spørg i butikken.",
  stoppet: "Butikken tager ikke imod nye kunder lige nu. Spørg i butikken.",
  fuld: "Butikken tager ikke imod nye kunder lige nu. Spørg i butikken.",
};

// Tilmelding paa henvisningssiden. Saetter kort-cookien (samme som Stemplets
// claim), saa "Tilføj til Wallet" og et senere besoeg paa siden genkender kortet.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");

  // Samme generoese loft pr. IP som kortets tilmelding (kontakt): en travl cafe
  // paa een WiFi eller et mobilnet bag faelles IP maa ikke afvise kunder.
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("referral-signup", ip, 200, 3600).catch(() => true))) {
    return apiError("RATE_LIMIT", "Der er travlt lige nu. Prøv igen om lidt.", 429);
  }

  const jar = await cookies();
  const existingDid = jar.get(DEVICE_ID_COOKIE)?.value;
  const deviceId = existingDid ?? newDeviceId();

  let res;
  try {
    res = await signupForReferrals({
      slug,
      name: parsed.data.name,
      email: parsed.data.email,
      consent: parsed.data.consent,
      code: parsed.data.code,
      source: parsed.data.source,
      cardTokenFor: (businessId) => jar.get(cardCookieName(businessId))?.value,
      deviceId,
    });
  } catch (e) {
    captureServerError(e, { route: "henvisninger/tilmeld", extra: { slug } });
    return apiError("SERVER", "Der opstod en kortvarig fejl. Prøv igen.", 500);
  }

  const out = res.ok
    ? NextResponse.json({
        ok: true,
        code: res.code,
        referred: res.referred,
        alreadyCustomer: res.alreadyCustomer,
      })
    : NextResponse.json(
        { ok: false, code: res.error, message: MESSAGES[res.error] },
        { status: 200 },
      );
  // Enheds-cookien saettes kun, naar kortet er hentet. Ved et dobbelttryk fra en
  // ny telefon faar hvert tryk sit eget id; taberens id (og tomme kort) maa ikke
  // overskrive vinderens.
  if (res.ok && !existingDid) out.cookies.set(DEVICE_ID_COOKIE, deviceId, deviceCookieOptions());
  if (res.ok) out.cookies.set(cardCookieName(res.businessId), res.authToken, cardCookieOptions());
  return out;
}
