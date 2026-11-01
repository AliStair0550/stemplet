import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import QRCode from "qrcode";
import { APP_URL } from "@/lib/env";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";
import { CARDS, MemberCard } from "@/components/kundekort/MemberCard";
import "@/components/kundekort/kundekort.css";

// "Hør mere": til den, der gerne vil vide mere, foer de opretter sig. Proev kortet
// paa din egen telefon (/prøv), og skriv dig op med mobilnummer, saa Ali kan ringe. Paa en computer viser vi en QR-kode, saa telefonen kan aabne demoen.
// Samme moerke udtryk som forsidens hero.

export const metadata: Metadata = {
  title: { absolute: "Hør mere om Folka Kort" },
  description: "Skriv dig op og hør mere om Folka Kort, eller prøv kortet på din egen telefon. Ingen app.",
  alternates: { canonical: "/hør-mere" },
  // Delinger peger paa siden selv (ikke forsiden) og viser forsidens delebillede.
  openGraph: {
    title: "Hør mere om Folka Kort",
    description: "Skriv dig op og hør mere om Folka Kort, eller prøv kortet på din egen telefon. Ingen app.",
    url: "/hør-mere",
    siteName: "Folka Kort",
    locale: "da_DK",
    type: "website",
    images: ["/opengraph-image"],
  },
};

const inter = Inter({ subsets: ["latin"], variable: "--font-kk", display: "swap" });

export default async function HoerMerePage() {
  const tryUrl = `${APP_URL}/pr%C3%B8v`;
  const qr = await QRCode.toDataURL(tryUrl, { margin: 1, width: 320, color: { dark: "#061C3D", light: "#FFFFFF" } });

  return (
    <main className={`${inter.variable} kk kk-dark min-h-screen pb-16`} style={{ fontFamily: "var(--font-kk), system-ui, sans-serif" }}>
      <header className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/folka-logo-hvid.svg" alt="Folka" width={189} height={105} className="h-8 w-auto" />
          <span className="h-5 w-px bg-white/20" aria-hidden />
          <span className="text-[15px] font-medium text-white/80">Kort</span>
        </Link>
        <Link
          href="/start"
          className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Opret dit kort
        </Link>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 pt-8 text-center sm:px-6 sm:pt-14">
        <h1 className="text-[clamp(2.2rem,5.4vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
          Vil du høre mere?
        </h1>
        <p className="mx-auto mt-4 max-w-[32rem] text-[1.05rem] leading-relaxed text-white/70">
          Prøv kortet på din egen telefon, og skriv dig op. Så ringer vi og fortæller, hvordan Folka Kort kan give din
          butik flere stamkunder.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1000px] gap-5 px-4 sm:px-6 md:grid-cols-2">
        {/* Proev kortet */}
        <section className="flex flex-col overflow-hidden rounded-[28px] bg-white/[0.06] p-7 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] backdrop-blur-xl sm:p-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/60">Prøv kortet</p>
          <h2 className="mt-2 text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em]">Læg det i din egen Wallet.</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Et rigtigt kort på få sekunder, præcis som dine kunder oplever det. Ingen app.
          </p>

          <div className="mt-6 flex flex-1 items-center gap-6">
            {/* Ingen drop-shadow-filter: det tegner kortet som et billede i lav
                opløsning paa telefonen, saa QR-koden bliver uskarp. Kortet har
                sin egen skygge. */}
            <div className="w-[150px] shrink-0 -rotate-6 sm:w-[170px]" aria-hidden>
              <MemberCard card={CARDS.cafe!} sizes="170px" hideShop />
            </div>
            {/* Computer: scan med telefonen. Mobil: knappen nedenfor. */}
            <div className="hidden flex-col items-center gap-2 md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR-kode til at prøve kortet" width={132} height={132} className="rounded-xl bg-white p-2" />
              <span className="text-[12px] text-white/60">Scan med din telefon</span>
            </div>
          </div>

          <Link
            href="/prøv"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Prøv kortet på din telefon
          </Link>
        </section>
        {/* Skriv dig op. dash-theme: Folkas moerkeblaa knap (ikke Stemplets gamle rustfarve). */}
        <section className="dash-theme rounded-[28px] bg-white p-7 text-left text-[#0B1628] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] sm:p-8">
          <p className="text-[#1B5EAE]" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Skriv dig op
          </p>
          <h2 className="mt-2 text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.03em]">Skriv dig op, så rækker vi ud.</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5F6B7E]">
            Vi ringer, svarer på dine spørgsmål og hjælper dig i gang med kortet i din butik.
          </p>
          <div className="mt-6">
            <NewsletterSignup variant="lead" source="hoer-mere" />
          </div>
        </section>

      </div>

      <p className="mx-auto mt-10 max-w-[1000px] px-4 text-center text-[14px] text-white/60 sm:px-6">
        Klar nu?{" "}
        <Link href="/start" className="font-semibold text-white underline-offset-4 hover:underline">
          Opret dit kort gratis
        </Link>
        . Tre måneder gratis, derefter 49 kr. om måneden. Ingen binding.
      </p>
    </main>
  );
}
