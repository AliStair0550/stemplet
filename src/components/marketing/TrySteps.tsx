import Image from "next/image";
import QRCode from "qrcode";
import { Section, Eyebrow } from "@/components/ui";
import { APP_URL } from "@/lib/env";
import { StepTabs } from "./StepTabs";

// Alternativ "proev det selv + saadan virker det"-sektion: foerst et scan-QR-panel,
// derefter rolle-opdelte trin i rene kort. Bygget til at kunne sammenlignes med den
// animerede demo ovenfor, saa vi kan vurdere hvad der er bedst.
export default async function TrySteps() {
  let qr = "";
  try {
    qr = await QRCode.toDataURL(`${APP_URL}/prøv`, {
      margin: 1,
      width: 360,
      color: { dark: "#1C1917", light: "#FFFFFF" },
    });
  } catch {
    qr = "";
  }

  return (
    <Section id="proev-trin" className="bg-parchment">
      {/* Proev det selv: scan og faa kortet i din egen Wallet (foerst) */}
      {qr ? (
        <div className="overflow-hidden rounded-[24px] bg-ink p-8 text-parchment shadow-hero md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="text-label font-medium uppercase tracking-[0.08em] text-terracotta">
                Prøv det selv
              </span>
              <h2 className="mt-4 text-[1.7rem] font-bold leading-[1.1] tracking-[-0.03em] md:text-[2.2rem]">
                Få stempelkortet i din egen Wallet. Lige nu.
              </h2>
              <p className="mt-4 max-w-md text-[1rem] leading-[1.6] text-parchment/65">
                Scan koden med dit kamera, og kortet ligger i Apple Wallet på fem
                sekunder. Ingen app. Ingen tilmelding.
              </p>
              <a
                href="/prøv"
                className="mt-6 inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-terracotta transition-colors hover:text-parchment"
              >
                Bruger du Android? Åbn webkortet
                <span aria-hidden>&rarr;</span>
              </a>
            </div>
            <div className="flex flex-col items-center gap-3 md:justify-self-end">
              <div className="rounded-[20px] bg-parchment p-4">
                <Image
                  src={qr}
                  width={180}
                  height={180}
                  alt="Scan for at prøve stempelkortet i din Wallet"
                  unoptimized
                  className="h-[168px] w-[168px]"
                />
              </div>
              <span className="text-[0.85rem] text-parchment/60">
                Scan med dit kamera
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Saadan virker det: fire trin pr. rolle */}
      <div className="mx-auto mt-20 max-w-xl text-center">
        <Eyebrow>Sådan virker det</Eyebrow>
        <h2 className="mt-4 text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.7rem]">
          Fire trin. Nul friktion.
        </h2>
      </div>

      <StepTabs />
    </Section>
  );
}
