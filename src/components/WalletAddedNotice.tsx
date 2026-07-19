// Groen kvittering: kortet er nu i Apple Wallet. Delt mellem claim-siden
// (/k/[slug], iPhone-flowet) og webkortet (/kort/[serial]), saa teksten og stilen
// kun findes eet sted.
export function WalletAddedNotice() {
  return (
    <div className="flex w-full items-start gap-3 rounded-xl border border-moss/25 bg-moss/[0.06] p-4 text-left">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moss text-parchment"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.92rem] font-[500] text-forest">
          Dit stempelkort er nu i din Wallet
        </span>
        <span className="text-[0.82rem] font-[300] leading-relaxed text-stone">
          Åbn Wallet og begynd at samle på dine stempler. Vis QR-koden til
          personalet ved hvert besøg.
        </span>
      </div>
    </div>
  );
}
