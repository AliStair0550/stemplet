// Forsidens scener: tro kopier af kundesiden, beskeden, laaseskaermen, Wallet-
// kortet og arbejdslisten, bygget i HTML og animeret med CSS (hv-* i
// src/app/henvisninger/forside.css). Hver scene er et kort loop, der kun koerer,
// mens den er synlig (Play), og staar stille ved reduceret bevaegelse. Uden
// animation viser hver scene en meningsfuld stillestaaende tilstand.

const INK = "#1D1D1F";
const MUTED = "#6E6E73";
const SURFACE = "#F5F5F7";
const LINE = "#D2D2D7";

export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[248px] shrink-0 rounded-[44px] bg-[#1D1D1F] p-[9px] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] ${className ?? ""}`}
    >
      <div className="relative flex h-[512px] flex-col overflow-hidden rounded-[36px] bg-white">
        <div className="absolute left-1/2 top-[9px] z-30 h-[22px] w-[74px] -translate-x-1/2 rounded-full bg-[#1D1D1F]" />
        {children}
      </div>
    </div>
  );
}

function ShopName() {
  return <p className="pt-12 text-center text-[13px] font-semibold tracking-[-0.01em]">Salon Nord</p>;
}

function Field({ label, value, typeClass }: { label: string; value: string; typeClass?: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
      <div className="h-[34px] rounded-[9px] px-3 py-2.5 text-[12px]" style={{ background: SURFACE, color: INK }}>
        <span className={`inline-block ${typeClass ?? ""}`}>{value}</span>
      </div>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-full py-3 text-center text-[12.5px] font-semibold text-white ${className ?? ""}`}
      style={{ background: INK }}
    >
      {children}
    </div>
  );
}

function Check({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full" style={{ width: size, height: size, background: INK }}>
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none">
        <path
          className={className}
          d="M5 12.5l4.5 4.5L19 7.5"
          pathLength={1}
          stroke="#fff"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Hero: vennen skriver navn og nummer, trykker, og rabatten ligger klar. */
export function FriendScene() {
  return (
    <div className="relative flex flex-1 flex-col px-5 pb-6" style={{ color: INK }}>
      <ShopName />
      <h3 className="mt-8 text-[21px] font-semibold leading-[1.15] tracking-[-0.02em]">
        Sara har givet dig 100 kr. hos Salon Nord
      </h3>
      <div className="mt-7 flex flex-col gap-3">
        <Field label="Navn" value="Emma" typeClass="hv-type-name" />
        <Field label="Mobilnummer" value="22 41 87 09" typeClass="hv-type-phone" />
      </div>
      <div className="mt-auto">
        <Pill className="hv-press">Hent min rabat</Pill>
      </div>
      <div className="hv-success absolute inset-0 z-20 flex flex-col items-center justify-center bg-white px-6 text-center">
        <Check className="hv-check" size={56} />
        <p className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">Velkommen, Emma</p>
        <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>
          100 kr. ligger klar til dit første besøg.
        </p>
      </div>
    </div>
  );
}

/** Kundens egen side (stillestaaende, bag hero-telefonen). */
export function CodeScreen() {
  return (
    <div className="flex flex-1 flex-col items-center px-5 pb-6 text-center" style={{ color: INK }}>
      <ShopName />
      <p className="mt-10 text-[11px]" style={{ color: MUTED }}>
        Din kode
      </p>
      <p className="mt-1 text-[30px] font-bold tracking-[-0.01em]">SARA-K7</p>
      <div className="mt-auto w-full">
        <Pill>Del med en ven</Pill>
      </div>
    </div>
  );
}

const APPS = [
  { name: "Beskeder", bg: "#34C759", glyph: "M5 6h14v9H9l-4 3z" },
  { name: "Messenger", bg: "#0A84FF", glyph: "M6 15l4-5 3 3 5-5-4 5-3-3z" },
  { name: "WhatsApp", bg: "#25D366", glyph: "M12 5a7 7 0 0 0-6 10.5L5 19l3.6-1A7 7 0 1 0 12 5z" },
  { name: "Mail", bg: "#5AC8FA", glyph: "M4 7h16v10H4zM4 7l8 6 8-6" },
];

/** Trin 1: kunden trykker Del, og delingsmenuen glider op. */
export function ShareScene() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-5 pb-6 text-center" style={{ color: INK }}>
      <ShopName />
      <p className="mt-10 text-[11px]" style={{ color: MUTED }}>
        Din kode
      </p>
      <p className="mt-1 text-[30px] font-bold tracking-[-0.01em]">SARA-K7</p>
      <div className="mt-auto w-full">
        <Pill className="hv-share-btn">Del med en ven</Pill>
      </div>
      <div className="hv-dim absolute inset-0 z-10 bg-black" />
      <div className="hv-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-[#F2F2F7] px-4 pb-7 pt-3">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#C7C7CC]" />
        <div className="rounded-[12px] bg-white p-3 text-left">
          <p className="text-[11px] font-semibold">100 kr. hos Salon Nord</p>
          <p className="text-[10px]" style={{ color: MUTED }}>
            stemplet.alius.dk
          </p>
        </div>
        <div className="mt-4 flex justify-between px-1">
          {APPS.map((a) => (
            <div key={a.name} className="flex flex-col items-center gap-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[11px]" style={{ background: a.bg }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round">
                  <path d={a.glyph} />
                </svg>
              </span>
              <span className="text-[9px]" style={{ color: INK }}>
                {a.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Trin 2: beskeden fra Sara tikker ind hos vennen. */
export function MessageScene() {
  return (
    <div className="flex flex-1 flex-col bg-white" style={{ color: INK }}>
      <div className="flex flex-col items-center border-b pb-3 pt-11" style={{ borderColor: "#ECECEC" }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C7C7CC] text-[14px] font-semibold text-white">
          S
        </span>
        <span className="mt-1 text-[10.5px]">Sara</span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 px-3 pb-8">
        <div className="hv-dots flex w-fit gap-1 rounded-[16px] bg-[#E9E9EB] px-3 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
        </div>
        <p className="hv-b1 max-w-[80%] rounded-[16px] bg-[#E9E9EB] px-3 py-2 text-[12px] leading-snug">
          Prøv min frisør. Du får 100 kr.
        </p>
        <div className="hv-b2 w-[78%] overflow-hidden rounded-[16px] bg-[#E9E9EB]">
          <div className="flex h-20 items-center justify-center bg-[#1D1D1F]">
            <span className="text-[15px] font-semibold text-white">Salon Nord</span>
          </div>
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold leading-snug">Sara har givet dig 100 kr.</p>
            <p className="text-[9.5px]" style={{ color: MUTED }}>
              stemplet.alius.dk
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Trin 3: Wallet-kortets besked lander paa laaseskaermen. */
export function NotifyScene() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E4E0DA] px-3 text-center">
      <p className="mt-14 text-[11px] font-medium text-[#1D1D1F]/60">tirsdag 14. oktober</p>
      <p className="text-[56px] font-semibold leading-none tracking-[-0.03em] text-[#1D1D1F]/85">10.42</p>
      <div className="hv-notif mt-5 w-full rounded-[18px] bg-white/80 p-3 text-left backdrop-blur">
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

/** Wallet-kortet: et nyt stempel falder paa plads, og "Til gode" skifter. */
export function WalletScene() {
  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[340px] rounded-[18px] bg-[#2A2724] p-5 text-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold">Salon Nord</span>
        <span className="text-right">
          <span className="block text-[9px] tracking-[0.08em] text-white/60">STEMPLER</span>
          <span className="block text-[15px] font-semibold">7 af 10</span>
        </span>
      </div>
      <div className="mt-5 grid grid-cols-5 gap-2.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="flex aspect-square items-center justify-center rounded-full border border-white/25">
            {i < 6 ? <span className="h-[62%] w-[62%] rounded-full bg-white" /> : null}
            {i === 6 ? <span className="hv-stamp h-[62%] w-[62%] rounded-full bg-white" /> : null}
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-end justify-between">
        <span>
          <span className="block text-[9px] tracking-[0.08em] text-white/60">HENVIS EN VEN</span>
          <span className="block text-[17px] font-semibold tracking-[0.02em]">SARA-K7</span>
        </span>
        <span className="relative text-right">
          <span className="block text-[9px] tracking-[0.08em] text-white/60">TIL GODE</span>
          <span className="relative block h-[22px] w-[110px]">
            <span className="hv-owed-old absolute inset-0 text-[17px] font-semibold text-white/70">Intet endnu</span>
            <span className="hv-owed-new absolute inset-0 text-[17px] font-semibold">Gratis klip</span>
          </span>
        </span>
      </div>
      <div className="mt-6 flex justify-center">
        <span className="grid h-[74px] w-[74px] grid-cols-6 gap-[2px] rounded-[8px] bg-white p-[6px]">
          {Array.from({ length: 36 }, (_, i) => (
            <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 ? "bg-white" : "bg-[#1D1D1F]"} />
          ))}
        </span>
      </div>
    </div>
  );
}

function Row({
  name,
  sub,
  action,
  className,
  children,
}: {
  name: string;
  sub: string;
  action: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 rounded-[12px] border bg-white px-4 py-3" style={{ borderColor: "#ECEAE6" }}>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold" style={{ color: INK }}>
            {name}
          </p>
          <p className="truncate text-[11px]" style={{ color: MUTED }}>
            {sub}
          </p>
        </div>
        <span className="relative shrink-0">
          <span className="block rounded-full px-4 py-2 text-[11.5px] font-medium text-white" style={{ background: INK }}>
            {action}
          </span>
          {children}
        </span>
      </div>
    </div>
  );
}

function Swap({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-grid font-normal" style={{ color: MUTED }}>
      <span className="hv-count-old [grid-area:1/1]">{from}</span>
      <span className="hv-count-new [grid-area:1/1]">{to}</span>
    </span>
  );
}

const BURST = [
  [-26, -18],
  [-30, 6],
  [-14, 24],
  [12, 26],
  [30, 10],
  [28, -16],
  [8, -28],
  [-10, -30],
];

/** Disken: markoeren trykker Rabat givet, raekken forsvinder, belønningen dukker op. */
export function DeskScene() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[14px] border bg-white shadow-[0_30px_70px_-34px_rgba(0,0,0,0.35)]"
      style={{ borderColor: LINE }}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ borderColor: "#ECEAE6", background: "#FBFBFC" }}>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E3E1DD]" />
      </div>
      <div className="relative px-5 py-6 sm:px-8 sm:py-8" style={{ background: "#FAF9F7" }}>
        <div className="hv-toast absolute inset-x-0 top-3 z-20 flex justify-center px-4">
          <div className="relative flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3 shadow-lg" style={{ borderColor: "#ECEAE6" }}>
            <span className="relative">
              <Check size={28} className="hv-toast-check" />
              {BURST.map(([x, y], i) => (
                <span
                  key={i}
                  className="hv-burst absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                  style={{ background: i % 2 ? INK : "#C9A24B", ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px` }}
                />
              ))}
            </span>
            <span className="text-[12.5px] font-semibold" style={{ color: INK }}>
              Emma har fået sin rabat
            </span>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/henvisninger-logo.svg" alt="" className="h-8 w-auto" />
        <p className="mt-6 mb-2 text-[13px] font-semibold" style={{ color: INK }}>
          Venter på første besøg <Swap from="2" to="1" />
        </p>
        <div className="flex flex-col">
          <Row name="Emma" sub="Henvist af Sara · i dag" action="Rabat givet" className="hv-row-out">
            <svg viewBox="0 0 24 24" className="hv-cursor absolute left-1/2 top-1/2 h-6 w-6 drop-shadow" aria-hidden>
              <path d="M5 3l14 8-6 1.5L10 19z" fill="#1D1D1F" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
            </svg>
          </Row>
          <Row name="Jonas" sub="Henvist af Mikkel · i går" action="Rabat givet" className="pt-2" />
        </div>
        <p className="mt-6 mb-2 text-[13px] font-semibold" style={{ color: INK }}>
          Belønninger til gode <Swap from="1" to="2" />
        </p>
        <div className="flex flex-col">
          <Row name="Sara" sub="For at henvise Emma" action="Indløs gratis klip" className="hv-row-in" />
          <Row name="Louise" sub="For at henvise Ida" action="Indløs 100 kr." className="pt-2" />
        </div>
      </div>
    </div>
  );
}
