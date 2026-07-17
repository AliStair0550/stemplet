import Image from "next/image";

// Hero-stempelkort: en ren, Wallet-agtig mockup i brandets rust. Server-komponent
// (ingen JS, let foerste load). Kaffekopper som stempler, og den sidste plads er
// selve beloenningen (den gratis kop). Udtrykket kan ogsaa laves i et rigtigt
// Apple Wallet-pass (strip med kaffe-stempler + gratis-kop til sidst).

const FILLED = 7;
const REQUIRED = 10;

function Coffee({ stroke }: { stroke: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[52%] w-[52%]"
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
    <div className="w-full max-w-[19rem] animate-float sm:max-w-[23rem] md:max-w-[29rem]">
      <div className="rotate-[-1.5deg] rounded-[24px] bg-gradient-to-b from-[#A9572F] to-[#974829] p-6 text-[#F7EFE6] shadow-hero transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:rotate-0 sm:p-7 md:p-8">
        {/* Top: butikkens logo + korttype */}
        <div className="flex items-start justify-between gap-4">
          <Image
            src="/coffeelab.png"
            alt="Copenhagen Coffee Lab"
            width={124}
            height={36}
            className="h-8 w-auto opacity-95 [filter:brightness(0)_invert(1)] md:h-9"
          />
          <span className="mt-1 shrink-0 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#F7EFE6]/60 md:text-[0.66rem]">
            Stempelkort
          </span>
        </div>

        {/* Stempel-tal */}
        <div className="mt-6">
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[#F7EFE6]/60">
            Stempler
          </span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-[2.6rem] font-bold leading-none tracking-[-0.03em] md:text-[3rem]">
              {FILLED}
            </span>
            <span className="text-[1.4rem] font-semibold leading-none tracking-[-0.02em] text-[#F7EFE6]/45 md:text-[1.6rem]">
              /{REQUIRED}
            </span>
          </div>
        </div>

        {/* Kopper: 7 stemplet (hvid cirkel + rust kaffe), 2 tilbage (stiplet),
            og den sidste er den gratis kop (fremhaevet). */}
        <div className="mt-6 grid grid-cols-5 gap-3 md:mt-7">
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

        {/* Fod */}
        <div className="mt-6 h-px w-full bg-[#F7EFE6]/20 md:mt-7" />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[0.9rem] font-[300] text-[#F7EFE6]/75">
            10. kop er gratis
          </span>
          <span className="text-[0.9rem] font-bold text-[#F7EFE6]">
            3 stempler tilbage
          </span>
        </div>
      </div>
    </div>
  );
}
