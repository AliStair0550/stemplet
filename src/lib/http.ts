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

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}
