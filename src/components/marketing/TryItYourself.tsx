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
            className="mt-5 inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-terracotta transition-colors hover:text-terracotta-dark"
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

        {/* QR taet paa teksten (desktop) */}
        <div className="mt-10 hidden shrink-0 flex-col items-center gap-4 md:mt-10 md:flex">
          <div className="rounded-[20px] bg-white p-4 shadow-card ring-1 ring-black/5">
            <Image
              src={qr}
              width={180}
              height={180}
              alt="Scan for at prøve stempelkortet i din Wallet"
              unoptimized
              className="h-[170px] w-[170px]"
            />
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
