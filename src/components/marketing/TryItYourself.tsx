import Image from "next/image";
import QRCode from "qrcode";
import { Section, Eyebrow, btnClass, CtaGlow, WalletIcon, CTA_EMPHASIS } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { loadDemoBusiness } from "@/lib/demo";
import { APP_URL } from "@/lib/env";
import type { StampIconKey } from "@/lib/brand";

// "Prøv det selv": besoegeren laegger et RIGTIGT demo-kort i sin egen Wallet.
// Desktop viser QR (scannes med telefonen), mobil viser knapperne direkte.
export default async function TryItYourself() {
  // Robust: fejler DB'en (fx ved build), springes sektionen bare over i stedet
  // for at vaelte forsiden.
  let biz: Awaited<ReturnType<typeof loadDemoBusiness>> = null;
  let qr = "";
  try {
    biz = await loadDemoBusiness();
    if (!biz || biz.cards.length === 0) return null;
    qr = await QRCode.toDataURL(`${APP_URL}/prøv`, {
      margin: 1,
      width: 360,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }
  const card = biz.cards[0];

  return (
    <Section id="demo" className="scroll-mt-24 bg-moss/[0.04]">
      <div className="max-w-xl">
        <Eyebrow>Prøv det selv</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Få det digitale stempelkort i din egen Wallet. Lige nu.
        </h2>
        <p className="mt-4 font-[300] text-[0.95rem] leading-[1.8] text-stone">
          Scan koden. Få kortet direkte i Apple Wallet. Ingen app. Ingen
          tilmelding. En enkel oplevelse, dine kunder vil elske.
        </p>
      </div>

      <div className="mt-14 grid items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        {/* Det rigtige demo-kort: levende, svaevende, med glOEd som i hero */}
        <div className="order-2 flex justify-center md:order-1">
          <div className="relative w-full max-w-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.6rem] opacity-25 blur-[80px]"
              style={{ background: biz.primaryColor }}
            />
            <div className="animate-float">
              <StampCard
                businessName={biz.name}
                logoUrl={biz.logoUrl}
                primaryColor={biz.primaryColor}
                textColor={biz.textColor}
                stampIcon={card.stampIcon as StampIconKey}
                stamps={4}
                required={card.stampsRequired}
                rewardText={card.rewardText}
                shine
              />
            </div>
          </div>
        </div>

        {/* Handling: desktop = QR (mindre end kortet), mobil = knapper */}
        <div className="order-1 flex flex-col items-center gap-6 md:order-2">
          {/* Desktop: QR til at scanne med telefonen */}
          <div className="hidden flex-col items-center gap-4 md:flex">
            <div className="rounded-[1.25rem] bg-white p-4 shadow-card ring-1 ring-black/5">
              <Image
                src={qr}
                width={180}
                height={180}
                alt="Scan for at prøve stempelkortet i din Wallet"
                unoptimized
                className="h-[min(34vw,160px)] w-[min(34vw,160px)]"
              />
            </div>
            <p className="inline-flex items-center gap-2 text-[0.85rem] font-[300] text-stone">
              <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
              Scan med dit kamera
            </p>
          </div>

          {/* Mobil: ét tryk direkte i Wallet, plus Android-fallback */}
          <div className="flex w-full max-w-xs flex-col items-center gap-3 md:hidden">
            <CtaGlow className="w-full">
              <a
                href="/prøv"
                className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
              >
                <WalletIcon />
                Læg i Apple Wallet
              </a>
            </CtaGlow>
            <a
              href="/prøv"
              className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
            >
              Bruger du Android? Åbn webkortet
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
