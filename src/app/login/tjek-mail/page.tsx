import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { KundekortMark } from "@/components/ProductLogo";
import { emailSchema } from "@/lib/validation";
import { isSuperadminEmail } from "@/lib/superadmin-emails";
import { LOGIN_EMAIL_COOKIE } from "@/lib/login-code";

// Forbigaaende kvitteringsside uden SEO-vaerdi. Crawlbar (ikke i robots-
// disallow), saa Google ser noindex og holder den ude af indekset.
export const metadata: Metadata = {
  title: { absolute: "Tjek din mail - Folka Kort" },
  robots: { index: false },
};

const FONT = 'var(--font-kk), -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

const ERRORS: Record<string, string> = {
  kode: "Koden passer ikke, eller den er udløbet. Tjek mailen, eller bed om en ny.",
  mange: "For mange forsøg. Vent et kvarter, eller bed om en ny kode.",
  server: "Noget drillede et øjeblik. Prøv linket eller koden igen.",
};

export default async function CheckMailPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string }>;
}) {
  const { fejl } = await searchParams;
  const error = fejl ? ERRORS[fejl] ?? null : null;
  // E-mailen fra login-formularen (kortlivet cookie). Koden virker kun sammen
  // med den, saa uden cookie viser vi bare "brug linket".
  const raw = (await cookies()).get(LOGIN_EMAIL_COOKIE)?.value;
  const parsed = emailSchema.safeParse(raw);
  const email = parsed.success ? parsed.data.toLowerCase() : null;

  return (
    <main className="dash-theme flex min-h-screen flex-col bg-white text-[#0B1628] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden">
          <KundekortMark />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-20 sm:px-6">
        <div className="flex w-full max-w-[400px] flex-col items-start gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#061C3D]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <h1 className="text-[40px] font-bold leading-[1.04] tracking-[-0.04em]">Tjek din mail.</h1>
          <p className="text-[17px] leading-relaxed text-[#0B1628]/60">
            {email ? (
              <>
                Vi har sendt en kode til <span className="font-medium text-[#0B1628]">{email}</span>. Skriv den her, eller tryk på linket i mailen.
              </>
            ) : (
              "Vi har sendt et login-link. Åbn mailen på denne enhed, så er du inde i dashboardet."
            )}
          </p>
          {email ? (
            // Almindelig GET-formular direkte til Auth.js' callback (samme som
            // linket i mailen). Ruten lofter forsoeg og sender en forkert kode
            // tilbage hertil med ?fejl=kode.
            <form action="/api/auth/callback/resend" method="get" className="flex w-full flex-col gap-3">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="callbackUrl" value={isSuperadminEmail(email) ? "/admin" : "/app"} />
              <input type="hidden" name="kilde" value="kode" />
              <label className="flex flex-col gap-2">
                <span className="text-[15px] font-medium">Kode fra mailen</span>
                <input
                  name="token"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,7}"
                  maxLength={7}
                  placeholder="123 456"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "kode-fejl" : undefined}
                  className="min-h-[60px] rounded-[14px] bg-[#F2F5F9] px-4 text-center text-[28px] font-semibold tracking-[0.18em] text-[#0B1628] outline-none placeholder:text-[#0B1628]/25 focus:ring-2 focus:ring-[#1B5EAE]"
                />
              </label>
              {error ? (
                <p id="kode-fejl" role="alert" className="text-[15px] text-rust">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#061C3D] px-8 text-[17px] font-semibold text-white transition-[transform,background-color] hover:bg-[#0A2D5A] active:scale-[0.98]"
              >
                Log ind
              </button>
            </form>
          ) : error ? (
            <p role="alert" className="text-[15px] text-rust">
              {error}
            </p>
          ) : null}
          <p className="text-[15px] leading-relaxed text-[#0B1628]/60">
            Kan du ikke se mailen? Tjek din spam-mappe. Ellers{" "}
            <Link href="/login" className="font-medium text-[#0B1628] underline underline-offset-2">
              prøv igen
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
