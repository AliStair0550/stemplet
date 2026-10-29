import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { durableRateLimit } from "@/lib/rate-limit";
import { normalizeLoginCode } from "@/lib/login-code";

export const { POST } = handlers;

// Login-mailens token er en 6-cifret kode (se lib/login-code.ts), saa
// callback'et er loftet pr. e-mail: ellers kunne koden gaettes. Linket i mailen
// og kodefeltet paa "Tjek din mail" rammer begge denne rute. Kommer forsoeget fra
// kodefeltet (kilde=kode), ryddes koden for mellemrum, og en forkert kode sender
// tilbage til feltet i stedet for til login-siden.
const CODE_ATTEMPTS = 8;
const CODE_WINDOW_SECONDS = 15 * 60;

export async function GET(req: NextRequest) {
  if (!req.nextUrl.pathname.endsWith("/callback/resend")) return handlers.GET(req);

  const url = new URL(req.nextUrl);
  const fromCodeForm = url.searchParams.get("kilde") === "kode";
  const back = (fejl: string) => NextResponse.redirect(new URL(`/login/tjek-mail?fejl=${fejl}`, url.origin), 303);

  // Uden e-mail kunne en kode proeves mod alle konti uden loft, saa den kraeves
  // (vores links har den altid).
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return back("kode");
  let ok = false;
  try {
    ok = await durableRateLimit("login-code", email, CODE_ATTEMPTS, CODE_WINDOW_SECONDS);
  } catch {
    ok = false; // fail-closed: hellere et nyt forsoeg om lidt end et aabent loft
  }
  if (!ok) return back("mange");

  if (!fromCodeForm) return handlers.GET(req);

  url.searchParams.set("token", normalizeLoginCode(url.searchParams.get("token")));
  url.searchParams.delete("kilde");
  const res = await handlers.GET(new NextRequest(url, { headers: req.headers }));
  // Forkert eller udloebet kode: Auth.js sender til fejlsiden (/login?error=...).
  const location = res.headers.get("location") ?? "";
  if (location.includes("error=")) return back("kode");
  return res;
}
