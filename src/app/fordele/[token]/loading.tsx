// Vises med det samme, mens siden hentes (aabnet fra Wallet rammer den ofte en
// sovende database). Neutral, fordi butikkens farver foerst kendes bagefter.
export default function BenefitsLoading() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center gap-4 bg-[#F4F5F7] px-5 pt-[max(2.5rem,env(safe-area-inset-top))]" aria-busy="true" aria-label="Henter dine fordele">
      <div className="h-12 w-28 animate-pulse rounded-xl bg-black/[0.06]" />
      <div className="h-9 w-48 animate-pulse rounded-lg bg-black/[0.07]" />
      <div className="h-4 w-56 animate-pulse rounded bg-black/[0.05]" />
      <div className="mt-4 h-40 w-full max-w-md animate-pulse rounded-[22px] bg-black/[0.05]" />
      <div className="h-28 w-full max-w-md animate-pulse rounded-[22px] bg-black/[0.04]" />
    </main>
  );
}
