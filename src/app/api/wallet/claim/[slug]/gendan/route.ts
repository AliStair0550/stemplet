import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { APP_URL } from "@/lib/env";
import { normalizeEmail } from "@/lib/contact";
import { requestCardRecovery } from "@/lib/card-recovery";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Gendan dit kort": kunden skriver sin e-mail, og har den et kort hos butikken,
// sender vi et link. Svaret er altid det samme (og kommer foer mailen sendes),
// saa man ikke kan aflure, hvilke e-mails der har et kort.

const bodySchema = z.object({ email: z.string().max(1000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  const email = parsed.success ? normalizeEmail(parsed.data.email) : null;
  if (!email) {
    return NextResponse.json({ ok: false, message: "Skriv en gyldig e-mailadresse." });
  }

  // Loft pr. IP og pr. e-mail, saa ingen kan oversvoemme en indbakke.
  const ip = clientIp(req) ?? "ukendt";
  const allowed =
    (await durableRateLimit("recover-ip", ip, 20, 3600).catch(() => true)) &&
    (await durableRateLimit("recover-mail", `${slug}:${email}`, 5, 3600).catch(() => true));
  if (!allowed) {
    return NextResponse.json({ ok: false, message: "Der er sendt mange links. Prøv igen om lidt." });
  }

  after(async () => {
    try {
      await requestCardRecovery({ slug, email, baseUrl: APP_URL });
    } catch (e) {
      captureServerError(e, { route: "wallet:claim:gendan", extra: { slug } });
    }
  });
  return NextResponse.json({ ok: true });
}
