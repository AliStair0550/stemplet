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

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}
