import type { NextRequest } from "next/server";

/** Betroet klient-IP bag Vercels proxy.
 *  x-real-ip saettes af Vercel og kan IKKE spoofes af klienten. Det leftmost
 *  hop i x-forwarded-for ER klient-styret og maa aldrig bruges som sikkerheds-
 *  noegle (fx PIN-laas), da det saa kan roteres for at omgaa laasen. */
export function clientIp(req: NextRequest): string | null {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return null;
}

/** Kom forespoergslen fra en anden hjemmeside? Saa maa den ikke saette kundens
 *  kort-cookie (en fremmed side kunne ellers give kunden sit eget kort, og
 *  kundens stempler ville havne paa det). Browsere saetter Sec-Fetch-Site; vores
 *  egne formularer og fetch er "same-origin". */
export function isCrossSite(req: NextRequest): boolean {
  return req.headers.get("sec-fetch-site") === "cross-site";
}

/** Noegle til lofter pr. afsender. IPv6 samles pr. /64 (de foerste fire
 *  grupper), fordi en enkelt tilslutning normalt har en hel /64 og ellers kan
 *  skifte adresse for hvert forsoeg. */
export function ipRateKey(ip: string | null): string {
  if (!ip) return "ukendt";
  if (!ip.includes(":")) return ip;
  return ip.split(":").slice(0, 4).join(":") + "::/64";
}

/** Samlet loft for hele formularen pr. time, ud over loftet pr. afsender, saa
 *  mange skiftende IP-adresser ikke kan sende ubegraenset mange mails fra Folka. */
export const FORM_GLOBAL_PER_HOUR = {
  "marketing-signup": 100,
  "start-loyalitet": 30,
} as const;

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}
