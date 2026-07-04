import type { NextRequest } from "next/server";

/** Bedste bud på klientens IP bag Vercels proxy. */
export function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}
