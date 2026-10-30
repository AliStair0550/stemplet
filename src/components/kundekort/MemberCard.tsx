import Image from "next/image";
import type { StampIconKey } from "@/lib/brand";
import { StampIcon } from "@/components/StampIcon";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import { cn } from "@/lib/utils";

// Et medlemskort, som det ser ud i kundens Wallet (plakatformat): butikkens
// billede eller farve fylder kortet, og navn, felter og kode ligger ovenpaa.
// Ren visning til forsiden; tallene er eksempler.

/** QR-koden tegnes som et fast moenster, saa den ser aegte ud uden at pege nogen steder hen. */
const QR_SIZE = 25;
const QR = (() => {
  const cells: [number, number][] = [];
  let seed = 7;
  const finder = (x: number, y: number) => x < 8 && y < 8;
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      if (finder(x, y) || finder(QR_SIZE - 1 - x, y) || finder(x, QR_SIZE - 1 - y)) continue;
      seed = (seed * 1103515245 + 12345) % 2147483648;
      if (seed % 100 < 48) cells.push([x, y]);
    }
  }
  return cells;
})();

// Hele moenstret som EEN sti (i stedet for ~300 <rect> pr. kode), saa forsidens
// mange kort ikke giver tusindvis af elementer, som telefonen skal tegne.
const QR_PATH = (() => {
  const corners = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ];
  const parts = corners.map(([x, y]) => `M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z M${x + 2} ${y + 2}h3v3h-3z`);
  for (const [x, y] of QR) parts.push(`M${x} ${y}h1v1h-1z`);
  return parts.join("");
})();

export function QrCode({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className={cn("h-full w-full fill-[#020B1C]", className)} shapeRendering="crispEdges" aria-hidden>
      <path d={QR_PATH} fillRule="evenodd" />
    </svg>
  );
}

export type MemberCardData = {
  shop: string;
  icon: StampIconKey;
  /** Baggrundsfarve (og overlay-farve paa billeder). */
  bg: string;
  fg: string;
  photo?: string;
  /** Billedets fokuspunkt, fx "60% 50%". */
  focus?: string;
  /** Moenster af ikonet i stedet for billede. */
  pattern?: boolean;
  /** Stor tekst nederst, fx "Stamkunde". */
  title: string;
  stamps?: { n: number; of: number };
  /** Felt oeverst til hoejre, fx { label: "Stempler", value: "7 af 10" }. */
  corner?: { label: string; value: string };
  /** Felt nederst til venstre, fx { label: "Beloenning", value: "10. kop er gratis" }. */
  foot: { label: string; value: string };
};

function patternUrl(icon: StampIconKey, color: string): string {
  const markup = STAMP_ICON_PATHS[icon] ?? STAMP_ICON_PATHS.custom;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="${color}" color="${color}" opacity="0.16" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function MemberCard({
  card,
  className,
  sizes = "260px",
  priority = false,
}: {
  card: MemberCardData;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const { bg, fg } = card;
  return (
    <div
      className={cn("relative aspect-[1/1.42] w-full overflow-hidden rounded-[22px] kk-shadow-3", className)}
      style={{
        background: bg,
        color: fg,
        backgroundImage: card.pattern ? patternUrl(card.icon, fg) : undefined,
        backgroundSize: card.pattern ? "46px 46px" : undefined,
      }}
    >
      {card.photo ? (
        <>
          <Image
            src={card.photo}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
            style={{ objectPosition: card.focus ?? "50% 50%" }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${bg}b3 0%, ${bg}1a 32%, ${bg}26 55%, ${bg}f2 100%)` }}
          />
        </>
      ) : null}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-[6.5%]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: fg, color: bg }}>
            <StampIcon icon={card.icon} className="h-[18px] w-[18px]" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">{card.shop}</span>
        </div>
        {card.corner ? (
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[.08em] opacity-70">{card.corner.label}</p>
            <p className="text-[14px] font-semibold leading-tight tabular-nums">{card.corner.value}</p>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 grid gap-3 p-[6.5%]">
        <div>
          <p className="text-[24px] font-semibold leading-none tracking-[-0.03em]">{card.title}</p>
          {card.stamps ? (
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {Array.from({ length: card.stamps.of }, (_, i) => (
                <span
                  key={i}
                  className="h-[7px] flex-1 rounded-full"
                  style={{ background: fg, opacity: i < card.stamps!.n ? 1 : 0.25 }}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.08em] opacity-70">{card.foot.label}</p>
            <p className="text-[14px] font-semibold leading-tight">{card.foot.value}</p>
          </div>
          <div className="aspect-square w-[30%] shrink-0 rounded-[11px] bg-white p-1.5">
            <QrCode />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Eksempelkort fra forskellige brancher. Billederne er Folkas egne. */
export const CARDS: Record<string, MemberCardData> = {
  cafe: {
    shop: "Kaffestuen",
    icon: "coffee",
    bg: "#14110F",
    fg: "#FFFFFF",
    photo: "/kundekort/cafe.webp",
    focus: "60% 50%",
    title: "Stamkunde",
    stamps: { n: 7, of: 10 },
    corner: { label: "Stempler", value: "7 af 10" },
    foot: { label: "Belønning", value: "10. kop er gratis" },
  },
  salon: {
    shop: "Salon Nord",
    icon: "scissors",
    bg: "#2B1F2A",
    fg: "#FFFFFF",
    photo: "/kundekort/kolleger.webp",
    focus: "45% 40%",
    title: "Henvis en ven",
    corner: { label: "Din kode", value: "EMMA-K7" },
    foot: { label: "Til gode", value: "Gratis klip" },
  },
  blomster: {
    shop: "Blomsterhuset",
    icon: "flower",
    bg: "#1F2A1C",
    fg: "#FFFFFF",
    photo: "/kundekort/blomster.webp",
    focus: "50% 35%",
    title: "Stamkunde",
    stamps: { n: 4, of: 8 },
    corner: { label: "Stempler", value: "4 af 8" },
    foot: { label: "Belønning", value: "En buket på os" },
  },
  barber: {
    shop: "Barber Bo",
    icon: "comb",
    bg: "#101418",
    fg: "#E9D8B4",
    pattern: true,
    title: "Fast kunde",
    stamps: { n: 5, of: 6 },
    corner: { label: "Stempler", value: "5 af 6" },
    foot: { label: "Belønning", value: "6. klip gratis" },
  },
  bager: {
    shop: "Bageriet",
    icon: "croissant",
    bg: "#F3E6CF",
    fg: "#5B3A1E",
    pattern: true,
    title: "Morgenfrisk",
    stamps: { n: 9, of: 10 },
    corner: { label: "Stempler", value: "9 af 10" },
    foot: { label: "Belønning", value: "Gratis rugbrød" },
  },
  pizza: {
    shop: "Pizza Mamma",
    icon: "pizza",
    bg: "#B3261E",
    fg: "#FFF4E8",
    pattern: true,
    title: "Stamgæst",
    stamps: { n: 3, of: 8 },
    corner: { label: "Stempler", value: "3 af 8" },
    foot: { label: "Belønning", value: "8. pizza gratis" },
  },
  negle: {
    shop: "Nail Studio",
    icon: "nailpolish",
    bg: "#F6D9DF",
    fg: "#6B2737",
    pattern: true,
    title: "Henvis en ven",
    corner: { label: "Din kode", value: "SOFIE-2Q" },
    foot: { label: "Vennen får", value: "100 kr. rabat" },
  },
  bar: {
    shop: "Baren",
    icon: "beer",
    bg: "#1A1410",
    fg: "#FFFFFF",
    photo: "/kundekort/venner.webp",
    focus: "50% 45%",
    title: "Stamgæst",
    stamps: { n: 6, of: 10 },
    corner: { label: "Stempler", value: "6 af 10" },
    foot: { label: "Belønning", value: "Én på huset" },
  },
  is: {
    shop: "Isbaren",
    icon: "icecream",
    bg: "#CFEDE4",
    fg: "#0F4C3A",
    pattern: true,
    title: "Sommergæst",
    stamps: { n: 2, of: 6 },
    corner: { label: "Stempler", value: "2 af 6" },
    foot: { label: "Belønning", value: "Gratis kugle" },
  },
};
