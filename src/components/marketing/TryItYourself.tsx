import Image from "next/image";
import QRCode from "qrcode";
import { Section, Eyebrow, btnClass, CtaGlow, WalletIcon, CTA_EMPHASIS } from "@/components/ui";
import { loadDemoBusiness } from "@/lib/demo";
import { APP_URL } from "@/lib/env";
import { HowItWorksDemo } from "./HowItWorksDemo";

// "Prøv det selv": venstre side lader besoegeren laegge et RIGTIGT demo-kort i sin
// egen Wallet (QR paa desktop, knap paa mobil). Hoejre side viser en selvkoerende
// "saadan virker det" med tre roller (kunde, medarbejder, ejer).
export default async function TryItYourself() {
  // Robust: fejler DB'en (fx ved build), eller er demoen ikke sat op, springes
  // sektionen bare over i stedet for at vaelte forsiden. (Demoen skal findes,
  // ellers virker /prøv ikke.)
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
    <Section id="demo" className="scroll-mt-24 overflow-hidden bg-terracotta/[0.04]">
      <div className="max-w-xl">
        <Eyebrow>Prøv det selv</Eyebrow>
        <h2 className="mt-4 font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
          Få det digitale stempelkort i din egen Wallet. Lige nu.
        </h2>
        <p className="mt-4 font-[300] text-[0.95rem] leading-[1.8] text-stone">
          Scan koden. Få kortet direkte i Apple Wallet. Ingen app. Ingen
          tilmelding. En enkel oplevelse, dine kunder vil elske.
        </p>
      </div>

      <div className="mt-14 grid items-center gap-12 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
        {/* Venstre: proev det selv (desktop = QR, mobil = knap) */}
        <div className="order-1 flex flex-col items-center gap-6">
          <div className="hidden flex-col items-center gap-4 md:flex">
            <div className="rounded-[1.25rem] bg-white p-4 shadow-card ring-1 ring-black/5">
              <Image
                src={qr}
                width={180}
                height={180}
                alt="Scan for at prøve stempelkortet i din Wallet"
                unoptimized
                className="h-[min(30vw,150px)] w-[min(30vw,150px)]"
              />
            </div>
            <p className="inline-flex items-center gap-2 text-[0.85rem] font-[300] text-stone">
              <span className="h-2 w-2 animate-pulse rounded-full bg-terracotta" />
              Scan med dit kamera
            </p>
          </div>

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

        {/* Hoejre: animeret "saadan virker det" med butikkens rigtige data */}
        <div className="order-2 w-full">
          <HowItWorksDemo
            businessName={biz.name}
            reward={card.rewardText}
            passColor={biz.primaryColor}
            qrImage={qr}
          />
        </div>
      </div>
    </Section>
  );
}
