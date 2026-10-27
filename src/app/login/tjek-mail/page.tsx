import type { Metadata } from "next";
import Link from "next/link";
import { AliusWordmark } from "@/components/ProductLogo";

// Forbigaaende kvitteringsside uden SEO-vaerdi. Crawlbar (ikke i robots-
// disallow), saa Google ser noindex og holder den ude af indekset.
export const metadata: Metadata = {
  title: "Tjek din mail",
  robots: { index: false },
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';

export default function CheckMailPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-6">
        <AliusWordmark className="text-[1.6rem]" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-20 sm:px-6">
        <div className="flex w-full max-w-[400px] flex-col items-start gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <h1 className="text-[40px] font-bold leading-[1.04] tracking-[-0.04em]">Tjek din mail.</h1>
          <p className="text-[17px] leading-relaxed text-[#111]/60">
            Vi har sendt et login-link. Åbn mailen på denne enhed, så er du inde i dashboardet.
          </p>
          <p className="text-[15px] leading-relaxed text-[#111]/45">
            Kan du ikke se den? Tjek din spam-mappe. Ellers{" "}
            <Link href="/login" className="font-medium text-[#111] underline underline-offset-2">
              prøv igen
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
