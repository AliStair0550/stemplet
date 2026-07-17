// Hero-stempelkort: en ren, Wallet-agtig mockup i brandets rust. Server-komponent
// (ingen JS, let foerste load). Checkmark-cirkler som fyld: et roligt, tydeligt
// udtryk der ogsaa kan laves i et rigtigt Apple Wallet-pass (strip med
// stempel-positioner) uden ikoner pr. felt.

const FILLED = 7;
const REQUIRED = 10;

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A6502E"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[46%] w-[46%]"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function HeroStampCard() {
  return (
    <div className="w-full max-w-[19rem] animate-float sm:max-w-[23rem] md:max-w-[29rem]">
      <div className="rotate-[-1.5deg] rounded-[24px] bg-gradient-to-b from-[#A9572F] to-[#974829] p-6 text-[#F7EFE6] shadow-hero transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:rotate-0 sm:p-7 md:p-8">
        {/* Top: butik + korttype */}
        <div className="flex items-start justify-between">
          <span className="text-[1.15rem] font-bold tracking-[-0.02em] md:text-[1.3rem]">
            Coffee Lab
          </span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#F7EFE6]/60 md:text-[0.66rem]">
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

        {/* Cirkler: 7 stemplet (hvid + rust flueben), 3 tilbage (stiplet) */}
        <div className="mt-6 grid grid-cols-5 gap-3 md:mt-7">
          {Array.from({ length: REQUIRED }).map((_, i) =>
            i < FILLED ? (
              <span
                key={i}
                className="flex aspect-square items-center justify-center rounded-full bg-[#F7EFE6]"
              >
                <Check />
              </span>
            ) : (
              <span
                key={i}
                className="aspect-square rounded-full border-2 border-dashed border-[#F7EFE6]/40"
              />
            ),
          )}
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
