import Image from "next/image";

// Hero-stempelkort: en ren, Wallet-agtig mockup i brandets rust. Server-komponent
// (ingen JS, let foerste load). Kaffekopper som stempler, og den sidste plads er
// selve beloenningen (den gratis kop). Layoutet spejler et rigtigt Apple Wallet-
// pass: logo + "Stempler 7/10" i toppen, stempel-gitter, og "Beloenning" +
// "Samlet i alt" nederst. Ordmaerket er "Copenhagen Coffee" (samme skrift som det
// oprindelige logo, men uden "Lab", da de ikke er en rigtig kunde).

const FILLED = 7;
const REQUIRED = 10;
const LIFETIME = 21;

function Coffee({ stroke }: { stroke: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[50%] w-[50%]"
      aria-hidden
    >
      <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9h2.5a2 2 0 0 1 0 4H16" />
      <path d="M8 3.5c-.4.7-.4 1.3 0 2M11.5 3.5c-.4.7-.4 1.3 0 2" />
    </svg>
  );
}

export default function HeroStampCard() {
  return (
    <div className="w-full max-w-[16rem] animate-float sm:max-w-[21rem] md:max-w-[25.5rem]">
      <div className="relative overflow-hidden rotate-[2deg] rounded-[24px] bg-gradient-to-b from-[#A9572F] to-[#974829] p-6 text-[#F7EFE6] shadow-hero transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:rotate-0 sm:p-7 md:p-8">
        {/* Glimt: et bloedt lys-sweep henover kortet */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[sheenSweep_4.5s_ease-in-out_infinite]"
        />
        {/* Top: butikkens ordmaerke + stempel-tal (som pass-headeren) */}
        <div className="flex items-start justify-between gap-4">
          <Image
            src="/copenhagencoffee.png"
            alt="Copenhagen Coffee"
            width={124}
            height={36}
            priority
            sizes="124px"
            className="h-8 w-auto opacity-95 [filter:brightness(0)_invert(1)] md:h-9"
          />
          <div className="shrink-0 text-right">
            <div className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#F7EFE6]/60 md:text-[0.62rem]">
              Stempler
            </div>
            <div className="mt-0.5 text-[1.15rem] font-bold leading-none tracking-[-0.01em] tabular-nums md:text-[1.3rem]">
              {FILLED}
              <span className="text-[#F7EFE6]/45">/{REQUIRED}</span>
            </div>
          </div>
        </div>

        {/* Kopper: 7 stemplet (hvid cirkel + rust kaffe), 2 tilbage (stiplet),
            og den sidste er den gratis kop (fremhaevet). */}
        <div className="mt-8 grid grid-cols-5 gap-3.5 md:mt-10">
          {Array.from({ length: REQUIRED }).map((_, i) => {
            if (i < FILLED) {
              return (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-full bg-[#F7EFE6]"
                >
                  <Coffee stroke="#A6502E" />
                </span>
              );
            }
            if (i === REQUIRED - 1) {
              return (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-full border-2 border-[#F7EFE6]/70"
                >
                  <Coffee stroke="#F7EFE6" />
                </span>
              );
            }
            return (
              <span
                key={i}
                className="aspect-square rounded-full border-2 border-dashed border-[#F7EFE6]/40"
              />
            );
          })}
        </div>

        {/* Fod: beloenning (venstre) + samlet i alt (hoejre), som pass-felterne */}
        <div className="mt-8 h-px w-full bg-[#F7EFE6]/20 md:mt-10" />
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[#F7EFE6]/55 md:text-[0.6rem]">
              Belønning
            </div>
            <div className="mt-0.5 text-[0.92rem] font-[300] text-[#F7EFE6]/90">
              10. kop er gratis
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[#F7EFE6]/55 md:text-[0.6rem]">
              Samlet i alt
            </div>
            <div className="mt-0.5 text-[0.98rem] font-bold tabular-nums text-[#F7EFE6]">
              {LIFETIME}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
