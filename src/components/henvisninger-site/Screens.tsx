// Forsidens "skaermbilleder": tro kopier af kundesiden, beskeden paa
// laaseskaermen og arbejdslisten ved disken, bygget i HTML, saa de er skarpe paa
// alle skaerme og foelger med, naar siderne aendres. Ren visning, ingen logik.

const INK = "#1D1D1F";
const MUTED = "#6E6E73";
const SURFACE = "#F5F5F7";
const LINE = "#D2D2D7";

export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[248px] shrink-0 rounded-[44px] bg-[#1D1D1F] p-[9px] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] ${className ?? ""}`}
    >
      <div className="relative flex h-[512px] flex-col overflow-hidden rounded-[36px] bg-white">
        <div className="absolute left-1/2 top-[9px] h-[22px] w-[74px] -translate-x-1/2 rounded-full bg-[#1D1D1F]" />
        {children}
      </div>
    </div>
  );
}

function ShopName() {
  return <p className="pt-12 text-center text-[13px] font-semibold tracking-[-0.01em]">Salon Nord</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
      <div className="rounded-[9px] px-3 py-2.5 text-[12px]" style={{ background: SURFACE, color: INK }}>
        {value}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full py-3 text-center text-[12.5px] font-semibold text-white" style={{ background: INK }}>
      {children}
    </div>
  );
}

/** Vennens side: "Sara har givet dig 100 kr." med navn og mobil. */
export function FriendScreen() {
  return (
    <div className="flex flex-1 flex-col px-5 pb-6" style={{ color: INK }}>
      <ShopName />
      <h3 className="mt-8 text-[21px] font-semibold leading-[1.15] tracking-[-0.02em]">
        Sara har givet dig 100 kr. hos Salon Nord
      </h3>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: MUTED }}>
        Skriv dit navn og nummer, så ligger rabatten klar til dit første besøg.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Field label="Navn" value="Emma" />
        <Field label="Mobilnummer" value="22 41 87 09" />
      </div>
      <div className="mt-auto">
        <Pill>Hent min rabat</Pill>
      </div>
    </div>
  );
}

/** Kundens egen side: koden stort og en delingsknap. */
export function CodeScreen() {
  return (
    <div className="flex flex-1 flex-col items-center px-5 pb-6 text-center" style={{ color: INK }}>
      <ShopName />
      <p className="mt-10 text-[11px]" style={{ color: MUTED }}>
        Din kode
      </p>
      <p className="mt-1 text-[30px] font-bold tracking-[-0.01em]">SARA-K7</p>
      <p className="mt-3 text-[11.5px] leading-snug" style={{ color: MUTED }}>
        Din ven får 100 kr. ved første besøg. Du får et gratis klip, når vennen har været her.
      </p>
      <div className="mt-auto w-full">
        <Pill>Del med en ven</Pill>
        <div
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-full border py-2.5 text-[11.5px] font-medium"
          style={{ borderColor: LINE }}
        >
          <WalletGlyph />
          Tilføj til Apple Wallet
        </div>
      </div>
    </div>
  );
}

/** Laaseskaermen: Wallet-kortets besked, naar vennen har vaeret der. */
export function LockScreen() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E4E0DA] px-3 text-center">
      <p className="mt-14 text-[11px] font-medium text-[#1D1D1F]/60">tirsdag 14. oktober</p>
      <p className="text-[56px] font-semibold leading-none tracking-[-0.03em] text-[#1D1D1F]/85">10.42</p>
      <div className="mt-auto mb-24 w-full rounded-[18px] bg-white/75 p-3 text-left backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#1D1D1F] text-[9px] font-bold text-white">
            S
          </span>
          <span className="text-[10.5px] font-semibold text-[#1D1D1F]">Salon Nord</span>
          <span className="ml-auto text-[9.5px] text-[#1D1D1F]/50">nu</span>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-[#1D1D1F]">
          Din ven har været her. Du har nu et gratis klip til gode.
        </p>
      </div>
    </div>
  );
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
    </svg>
  );
}

function Row({ name, sub, action }: { name: string; sub: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border bg-white px-4 py-3" style={{ borderColor: "#ECEAE6" }}>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold" style={{ color: INK }}>
          {name}
        </p>
        <p className="truncate text-[11px]" style={{ color: MUTED }}>
          {sub}
        </p>
      </div>
      <span className="shrink-0 rounded-full px-4 py-2 text-[11.5px] font-medium text-white" style={{ background: INK }}>
        {action}
      </span>
    </div>
  );
}

/** Arbejdslisten ved disken, i en browserramme. */
export function DeskScreen() {
  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[720px] overflow-hidden rounded-[14px] border bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)]"
      style={{ borderColor: LINE }}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ borderColor: "#ECEAE6", background: "#FBFBFC" }}>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
      </div>
      <div className="px-5 py-6 sm:px-8 sm:py-8" style={{ background: "#FAF9F7" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/henvisninger-logo.svg" alt="" className="h-8 w-auto" />
        <div className="mt-5 rounded-full border bg-white px-4 py-2.5 text-[12px]" style={{ borderColor: "#E3E1DD", color: MUTED }}>
          Find kunde: navn, mobil eller kode
        </div>
        <p className="mt-6 mb-2 text-[13px] font-semibold" style={{ color: INK }}>
          Venter på første besøg <span className="font-normal" style={{ color: MUTED }}>2</span>
        </p>
        <div className="flex flex-col gap-2">
          <Row name="Emma" sub="Henvist af Sara · i dag" action="Rabat givet" />
          <Row name="Jonas" sub="Henvist af Mikkel · i går" action="Rabat givet" />
        </div>
        <p className="mt-6 mb-2 text-[13px] font-semibold" style={{ color: INK }}>
          Belønninger til gode <span className="font-normal" style={{ color: MUTED }}>1</span>
        </p>
        <Row name="Sara" sub="For at henvise Emma" action="Indløs gratis klip" />
      </div>
    </div>
  );
}
