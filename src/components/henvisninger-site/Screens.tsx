// Forsidens scener: iPhone-skaerme (kundesiden, delingsmenuen, Beskeder,
// laaseskaermen) og arbejdslisten, bygget i HTML og animeret med CSS (hv-* i
// src/app/henvisninger/forside.css). Hver scene er et kort loop, der kun koerer,
// mens den er synlig (Play), og staar stille ved reduceret bevaegelse. Uden
// animation viser hver scene en meningsfuld stillestaaende tilstand.

const INK = "#1D1D1F";
const MUTED = "#6E6E73";
const SURFACE = "#F5F5F7";
const LINE = "#D2D2D7";

/** iPhone-ramme med Dynamic Island, statuslinje, sideknapper og home-indikator. */
export function Phone({
  children,
  className,
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  /** Statuslinjens farve: moerk paa lys skaerm, lys paa moerk. */
  tone?: "dark" | "light";
}) {
  const fg = tone === "light" ? "#fff" : "#000";
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[252px] shrink-0 rounded-[46px] bg-[#1B1B1D] p-[7px] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45),inset_0_0_0_1.5px_#4A4A4E] ${className ?? ""}`}
    >
      <span className="absolute -left-[2px] top-[108px] h-7 w-[3px] rounded-l bg-[#3A3A3D]" />
      <span className="absolute -left-[2px] top-[150px] h-12 w-[3px] rounded-l bg-[#3A3A3D]" />
      <span className="absolute -right-[2px] top-[140px] h-16 w-[3px] rounded-r bg-[#3A3A3D]" />
      <div className="relative flex h-[524px] flex-col overflow-hidden rounded-[39px] bg-white">
        <div className="absolute inset-x-0 top-0 z-40 flex h-[44px] items-center justify-between px-[16px] pt-[2px]">
          <span className="w-[50px] text-center text-[12px] font-semibold tracking-[-0.01em]" style={{ color: fg }}>
            09.41
          </span>
          <span className="flex items-center gap-[4px]" style={{ color: fg }}>
            <svg viewBox="0 0 18 12" className="h-[9px] w-[13px]" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg viewBox="0 0 16 12" className="h-[9px] w-[12px]" fill="currentColor">
              <path d="M8 2.2c2.4 0 4.6.9 6.2 2.4l1.2-1.3A10.5 10.5 0 0 0 8 .4 10.5 10.5 0 0 0 .6 3.3l1.2 1.3A8.8 8.8 0 0 1 8 2.2zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.2 7.2 0 0 0 8 4a7.2 7.2 0 0 0-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4zm0 3.5c.6 0 1.2.2 1.6.6L8 11.6 6.4 9.9c.4-.4 1-.6 1.6-.6z" />
            </svg>
            <span className="relative flex h-[10px] w-[21px] items-center rounded-[3px] border border-current p-[1.5px] opacity-90">
              <span className="h-full w-[78%] rounded-[1.5px] bg-current" />
              <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r bg-current" />
            </span>
          </span>
        </div>
        <div className="absolute left-1/2 top-[10px] z-50 h-[25px] w-[74px] -translate-x-1/2 rounded-full bg-black" />
        {children}
        <div
          className="absolute bottom-[7px] left-1/2 z-50 h-[4px] w-[96px] -translate-x-1/2 rounded-full"
          style={{ background: fg }}
        />
      </div>
    </div>
  );
}

function ShopName() {
  return <p className="pt-14 text-center text-[13px] font-semibold tracking-[-0.01em]">Salon Nord</p>;
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
    <div className="relative flex flex-1 flex-col px-5 pb-8" style={{ color: INK }}>
      <ShopName />
      <h3 className="mt-7 text-[21px] font-semibold leading-[1.15] tracking-[-0.02em]">
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

/** Kundens egen side: et link at dele med en ven. */
export function LinkScreen({ buttonClass }: { buttonClass?: string }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-8 text-center" style={{ color: INK }}>
      <ShopName />
      <h3 className="mt-8 text-[21px] font-semibold leading-[1.15] tracking-[-0.02em]">
        Giv en ven 100 kr. hos Salon Nord
      </h3>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: MUTED }}>
        Du får et gratis klip, når vennen har været her.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left" style={{ background: SURFACE }}>
        <LinkGlyph />
        <span className="truncate text-[11px]" style={{ color: INK }}>
          stemplet.alius.dk/henvisninger/salon-nord
        </span>
      </div>
      <div className="mt-auto">
        <Pill className={buttonClass}>Del med en ven</Pill>
      </div>
    </div>
  );
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

const PEOPLE = [
  { name: "Emma", bg: "#F2C6A0" },
  { name: "Mikkel", bg: "#B8C9E6" },
  { name: "Ida", bg: "#C9DDB5" },
  { name: "Louise", bg: "#E6C3D6" },
];

const APPS = [
  { name: "Beskeder", bg: "#34C759", glyph: <path d="M12 5c-4.4 0-8 2.9-8 6.5 0 2 1.1 3.8 2.9 5L6 19.5l3.3-1.7c.9.3 1.8.4 2.7.4 4.4 0 8-2.9 8-6.6S16.4 5 12 5z" fill="#fff" /> },
  { name: "Messenger", bg: "#0A7CFF", glyph: <path d="M12 4.5c-4.3 0-7.5 3.1-7.5 7.1 0 2.1.9 3.9 2.4 5.2v2.7l2.4-1.3c.8.2 1.7.4 2.7.4 4.3 0 7.5-3.1 7.5-7S16.3 4.5 12 4.5zm.8 9.4-1.9-2-3.6 2 4-4.2 1.9 2 3.6-2-4 4.2z" fill="#fff" /> },
  { name: "WhatsApp", bg: "#25D366", glyph: <path d="M12 4.5a7.4 7.4 0 0 0-6.3 11.3l-1 3.7 3.8-1A7.4 7.4 0 1 0 12 4.5z" fill="none" stroke="#fff" strokeWidth={1.7} /> },
  { name: "Mail", bg: "#1E8CF5", glyph: <path d="M5 7.5h14v9H5zM5.5 8l6.5 5 6.5-5" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /> },
];

/** Trin 1: kunden trykker Del, og iPhones delingsmenu glider op. */
export function ShareScene() {
  return (
    <div className="relative flex flex-1 flex-col">
      <LinkScreen buttonClass="hv-share-btn" />
      <div className="hv-dim absolute inset-0 z-10 bg-black" />
      <div className="hv-sheet absolute inset-x-0 bottom-0 z-20 rounded-t-[20px] bg-[#F2F2F7] px-3.5 pb-6 pt-2.5">
        <div className="mx-auto mb-2.5 h-[5px] w-9 rounded-full bg-[#C7C7CC]" />
        <div className="flex items-center gap-2.5 rounded-[12px] bg-white p-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#1D1D1F] text-[11px] font-bold text-white">SN</span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[11px] font-semibold text-black">100 kr. hos Salon Nord</span>
            <span className="block truncate text-[9.5px] text-[#8E8E93]">stemplet.alius.dk</span>
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5E5EA] text-[10px] text-[#8E8E93]">✕</span>
        </div>
        <div className="mt-3 flex justify-between px-0.5">
          {PEOPLE.map((p) => (
            <span key={p.name} className="flex flex-col items-center gap-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-semibold text-white" style={{ background: p.bg }}>
                {p.name[0]}
              </span>
              <span className="text-[8.5px] text-black">{p.name}</span>
            </span>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-[#D1D1D6] px-0.5 pt-3">
          {APPS.map((a) => (
            <span key={a.name} className="flex flex-col items-center gap-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-[11px]" style={{ background: a.bg }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7">
                  {a.glyph}
                </svg>
              </span>
              <span className="text-[8.5px] text-black">{a.name}</span>
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[12px] bg-white px-3 py-2.5 text-[11px] text-black">
          Kopiér
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#000" strokeWidth={1.6}>
            <rect x="8" y="8" width="11" height="12" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h8" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Trin 2: Saras besked med linket tikker ind i Beskeder. */
export function MessageScene() {
  return (
    <div className="flex flex-1 flex-col bg-white text-left text-black">
      <div className="flex items-end justify-between border-b border-[#E5E5EA] bg-[#F9F9F9]/95 px-3 pb-2 pt-11">
        <svg viewBox="0 0 12 20" className="mb-3 h-4 w-3" fill="none" stroke="#007AFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2 2 10l8 8" />
        </svg>
        <span className="flex flex-col items-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#A5A9B4] to-[#878B96] text-[14px] font-semibold text-white">
            S
          </span>
          <span className="mt-0.5 text-[10px]">Sara ›</span>
        </span>
        <svg viewBox="0 0 24 24" className="mb-2.5 h-5 w-5" fill="none" stroke="#007AFF" strokeWidth={1.8} strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="3" />
          <path d="m16 10.5 6-3.5v10l-6-3.5z" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1.5 px-3 pb-3">
        <p className="mb-1 text-center text-[9px] text-[#8E8E93]">I dag 09.41</p>
        <div className="hv-dots flex w-fit gap-1 rounded-[18px] bg-[#E9E9EB] px-3 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#8E8E93]" />
        </div>
        <p className="hv-b1 max-w-[78%] rounded-[18px] bg-[#E9E9EB] px-3 py-2 text-[12px] leading-snug">
          Prøv min frisør. Du får 100 kr.
        </p>
        <div className="hv-b2 w-[74%] overflow-hidden rounded-[18px] bg-[#E9E9EB]">
          <div className="flex h-[88px] items-center justify-center bg-[#1D1D1F]">
            <span className="text-[16px] font-semibold tracking-[-0.01em] text-white">Salon Nord</span>
          </div>
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold leading-snug">Sara har givet dig 100 kr.</p>
            <p className="text-[9.5px] text-[#8E8E93]">stemplet.alius.dk</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 pb-7 pt-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E9E9EB] text-[16px] leading-none text-[#8E8E93]">+</span>
        <span className="flex-1 rounded-full border border-[#D1D1D6] px-3 py-1.5 text-[11px] text-[#C7C7CC]">iMessage</span>
      </div>
    </div>
  );
}

/** Trin 3: beskeden lander paa laaseskaermen. */
export function NotifyScene() {
  return (
    <div
      className="relative flex flex-1 flex-col items-center px-2.5 text-center text-white"
      style={{
        background:
          "radial-gradient(120% 70% at 20% 10%, #D9B9A0 0%, transparent 60%), radial-gradient(90% 70% at 90% 90%, #6F7F96 0%, transparent 65%), #8E8A86",
      }}
    >
      <svg viewBox="0 0 24 24" className="mt-12 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <p className="mt-1 text-[12px] font-medium opacity-90">tirsdag 14. oktober</p>
      <p className="text-[68px] font-bold leading-[0.95] tracking-[-0.02em] opacity-95">09.41</p>
      <div className="hv-notif mt-6 w-full rounded-[20px] bg-white/55 p-2.5 text-left text-black backdrop-blur-xl">
        <div className="flex items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#1D1D1F] text-[10px] font-bold text-white">
            SN
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold">Salon Nord</span>
              <span className="text-[9.5px] text-black/45">nu</span>
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug">Din ven har været her. Du har nu et gratis klip til gode.</span>
          </span>
        </div>
      </div>
      <div className="mt-auto mb-9 flex w-full justify-between px-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round">
            <path d="M9 3h6l-1 6h-4zM10 9h4v12h-4z" />
          </svg>
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round">
            <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
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
