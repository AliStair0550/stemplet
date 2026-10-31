import { NextResponse, type NextRequest } from "next/server";

// Telefonen faar sit enheds-id (stemplet_device), saa snart kundens side vises,
// ikke foerst naar kortet er hentet. Saa deler alle forsoeg fra samme telefon
// det samme id: et genforsoeg efter et tabt svar ("Hent kort" eller en
// selvbetjent scanning) finder det kort, der netop blev oprettet, i stedet for
// at lave et nyt eller svare "e-mailen findes allerede". Siderne er cachede, saa
// cookien kan ikke saettes fra selve siden; proxyen koerer foer cachen.
//
// Samme navn og indstillinger som deviceCookieOptions() i lib/cookies.ts (den
// fil kan ikke importeres her, fordi den er server-only).
const DEVICE_ID_COOKIE = "stemplet_device";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(DEVICE_ID_COOKIE)) {
    res.cookies.set(DEVICE_ID_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  // Kun kundens sider (butikssiden, henvisningslinks og scan-siden), og kun naar
  // telefonen ikke allerede har et id. Skal vaere bogstavelig tekst (Next laeser
  // den ved build).
  matcher: [
    { source: "/k/:path*", missing: [{ type: "cookie", key: "stemplet_device" }] },
    { source: "/s/:path*", missing: [{ type: "cookie", key: "stemplet_device" }] },
  ],
};
