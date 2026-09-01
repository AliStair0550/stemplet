import { NextResponse, type NextRequest } from "next/server";
import { pairDevice, KASSE_COOKIE, kasseCookieOptions } from "@/lib/kasse";
import { durableRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Enheds-parring som en RIGTIG top-niveau-navigation (form POST), ikke en
// server-action. Kasse-cookien saettes paa selve redirect-svaret, saa iOS Safari
// gemmer den paalideligt (server-action-fetch fik Safari til at droppe Set-Cookie,
// saa enheden "mistede" parringen og startede forfra). Samme pålidelige moenster
// som "Hent mit stempelkort".
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const code = String(form?.get("code") ?? "");
  const name = String(form?.get("name") ?? "");
  const kodeParam = encodeURIComponent(
    code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
  );

  const back = (query: string) =>
    NextResponse.redirect(new URL(`/kasse${query}`, APP_URL), { status: 303 });

  // Bremse mod gaetteri af parringskoder (pr. IP).
  if (!(await durableRateLimit("device-pair", clientIp(req) ?? "ukendt", 12, 600))) {
    return back(`?fejl=optaget&kode=${kodeParam}`);
  }

  const res = await pairDevice(code, name);
  if (!res.ok) {
    return back(`?fejl=ugyldig&kode=${kodeParam}`);
  }

  // Sat paa svaret (ikke via next/headers cookies()), saa den foelger med
  // top-niveau-redirect'en og gemmes af Safari.
  const ok = back("");
  ok.cookies.set(KASSE_COOKIE, res.token, kasseCookieOptions());
  return ok;
}
