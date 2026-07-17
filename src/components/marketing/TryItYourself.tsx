import Image from "next/image";
import QRCode from "qrcode";
import {
  Section,
  Eyebrow,
  btnClass,
  CtaGlow,
  WalletIcon,
  CTA_EMPHASIS,
} from "@/components/ui";
import { loadDemoBusiness } from "@/lib/demo";
import { APP_URL } from "@/lib/env";
import { StepTabs } from "./StepTabs";

// "Prøv det selv": laeg et RIGTIGT demo-kort i din egen Wallet (QR paa desktop,
// knap paa mobil), og se de fire trin for hver rolle (kunde, medarbejder, ejer).
export default async function TryItYourself() {
  // Robust: fejler DB'en (fx ved build), eller er demoen ikke sat op, springes
  // sektionen bare over i stedet for at vaelte forsiden.
  let biz: Awaited<ReturnType<typeof loadDemoBusiness>> = null;
  let qr = "";
  try {
    biz = await loadDemoBusiness();
    if (!biz || biz.cards.length === 0) return null;
    qr = await QRCode.toDataURL(`${APP_URL}/prøv`, {
      margin: 1,
      width: 360,
      color: { dark: "#1C1917", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }

  return (
    <Section id="demo" className="scroll-mt-24 overflow-hidden bg-terracotta/[0.04]">
      {/* Top: tekst med QR taet ved siden af (desktop) */}
      <div className="md:flex md:items-center md:gap-12">
        <div className="max-w-xl">
          <Eyebrow>Prøv det selv</Eyebrow>
          <h2 className="mt-4 font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
            Få det digitale stempelkort i din egen Wallet. Lige nu.
          </h2>
          <p className="mt-4 font-[300] text-[0.95rem] leading-[1.8] text-stone">
            Scan koden. Få kortet direkte i Apple Wallet. Ingen app. Ingen
            tilmelding. En enkel oplevelse, dine kunder vil elske.
          </p>
          {/* Android-link lige under teksten */}
          <a
            href="/prøv"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-terracotta transition-colors hover:text-terracotta-dark"
          >
            Bruger du Android? Åbn webkortet
            <span aria-hidden>&rarr;</span>
          </a>
          {/* Mobil: knap (QR kan ikke scannes paa egen skaerm) */}
          <div className="mt-6 max-w-xs md:hidden">
            <CtaGlow className="w-full">
              <a
                href="/prøv"
                className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
              >
                <WalletIcon />
                Læg i Apple Wallet
              </a>
            </CtaGlow>
          </div>
        </div>

        {/* QR taet paa teksten (desktop): et lille scan-kort med kamera-soegerens
            hjoerner, saa det tydeligt ligner noget man scanner */}
        <div className="mt-10 hidden shrink-0 flex-col items-center gap-4 md:mt-14 md:ml-6 md:flex">
          <div className="rounded-[22px] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(28,25,23,0.32)] ring-1 ring-ink/[0.06]">
            <div className="mb-3 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-slate">
                Prøvekort
              </span>
            </div>
            <div className="relative p-2.5">
              <Image
                src={qr}
                width={180}
                height={180}
                alt="Scan for at prøve stempelkortet i din Wallet"
                unoptimized
                className="h-[168px] w-[168px] rounded-[6px]"
              />
              {/* Fire soeger-hjoerner rammer koden ind uden at daekke den */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-6 w-6 rounded-tl-[10px] border-l-[2.5px] border-t-[2.5px] border-terracotta"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 h-6 w-6 rounded-tr-[10px] border-r-[2.5px] border-t-[2.5px] border-terracotta"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 rounded-bl-[10px] border-b-[2.5px] border-l-[2.5px] border-terracotta"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 rounded-br-[10px] border-b-[2.5px] border-r-[2.5px] border-terracotta"
              />
            </div>
          </div>
          <p className="inline-flex items-center gap-2 text-[0.85rem] font-[300] text-stone">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
            Scan med dit kamera
          </p>
        </div>
      </div>

      {/* Loyalitet gjort enkelt: fire trin pr. rolle */}
      <div className="mx-auto mt-20 max-w-xl text-center">
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.7rem]">
          Loyalitet gjort enkelt.
        </h2>
      </div>
      <StepTabs />
    </Section>
  );
}
