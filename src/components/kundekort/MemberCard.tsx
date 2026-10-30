import { useId } from "react";
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
  /** Tegnet motiv i kortets farver (i stedet for et foto). */
  art?: Art;
  /** Motivets accentfarve. */
  accent?: string;
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

export type Art = "aurora" | "sun" | "waves" | "rings" | "hills" | "arches";

/**
 * Kreative, tegnede motiver til eksempelkortene: nordlys, sol over horisont,
 * boelger, ringe, bakker og buer. Tegnet i kortets egne farver, saa de altid
 * passer sammen, er skarpe i alle stoerrelser og ikke viser mennesker.
 */
export function ArtLayer({ id, art, bg, fg, accent }: { id: string; art: Art; bg: string; fg: string; accent: string }) {
  const common = { className: "absolute inset-0 h-full w-full", viewBox: "0 0 100 142", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true } as const;
  if (art === "aurora") {
    // Bloede lysfelter (radiale overgange i stedet for sloer): skarpt og let at tegne.
    const glow = (key: string, color: string) => (
      <radialGradient id={`${id}-${key}`}>
        <stop offset="0" stopColor={color} stopOpacity="0.95" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
    );
    return (
      <svg {...common}>
        <defs>
          {glow("a", accent)}
          {glow("b", fg)}
          {glow("c", accent)}
        </defs>
        <rect width="100" height="142" fill={bg} />
        <ellipse cx="22" cy="42" rx="58" ry="40" fill={`url(#${id}-a)`} />
        <ellipse cx="88" cy="70" rx="46" ry="38" fill={`url(#${id}-b)`} opacity="0.32" />
        <ellipse cx="60" cy="14" rx="40" ry="24" fill={`url(#${id}-c)`} opacity="0.7" />
      </svg>
    );
  }
  if (art === "sun") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bg} />
            <stop offset="0.62" stopColor={accent} />
          </linearGradient>
        </defs>
        <rect width="100" height="142" fill={`url(#${id}-sky)`} />
        <circle cx="50" cy="80" r="24" fill={fg} opacity="0.9" />
        <rect y="80" width="100" height="62" fill={bg} />
        {[84, 88, 93, 99].map((y, i) => (
          <rect key={y} x={20 - i * 4} y={y} width={60 + i * 8} height="1.4" rx="0.7" fill={fg} opacity={0.5 - i * 0.1} />
        ))}
      </svg>
    );
  }
  if (art === "waves") {
    return (
      <svg {...common}>
        <rect width="100" height="142" fill={bg} />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M-10 ${44 + i * 13} C 15 ${34 + i * 13}, 35 ${56 + i * 13}, 55 ${44 + i * 13} S 95 ${34 + i * 13}, 115 ${46 + i * 13} V 142 H -10 Z`}
            fill={i % 2 ? accent : fg}
            opacity={0.12 + i * 0.07}
          />
        ))}
      </svg>
    );
  }
  if (art === "rings") {
    return (
      <svg {...common}>
        <rect width="100" height="142" fill={bg} />
        {[8, 16, 24, 32, 40, 48, 56].map((r, i) => (
          <circle key={r} cx="78" cy="40" r={r} fill="none" stroke={i % 2 ? accent : fg} strokeWidth="1.1" opacity={0.55 - i * 0.06} />
        ))}
        <circle cx="78" cy="40" r="5" fill={accent} />
      </svg>
    );
  }
  if (art === "hills") {
    return (
      <svg {...common}>
        <rect width="100" height="142" fill={accent} />
        <circle cx="72" cy="30" r="9" fill={fg} opacity="0.85" />
        <path d="M-10 70 Q 25 45 55 66 T 115 58 V 142 H -10 Z" fill={bg} opacity="0.55" />
        <path d="M-10 86 Q 30 64 62 84 T 115 78 V 142 H -10 Z" fill={bg} opacity="0.8" />
        <path d="M-10 102 Q 35 84 70 100 T 115 96 V 142 H -10 Z" fill={bg} />
      </svg>
    );
  }
  // arches: buer som et museums soejlegang.
  return (
    <svg {...common}>
      <rect width="100" height="142" fill={bg} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${8 + i * 30} 84 V 44 a 12 12 0 0 1 24 0 V 84`}
          fill={i === 1 ? accent : "none"}
          stroke={fg}
          strokeWidth="1.2"
          opacity={i === 1 ? 0.9 : 0.45}
        />
      ))}
      <rect x="4" y="84" width="92" height="1.4" fill={fg} opacity="0.5" />
    </svg>
  );
}

function patternUrl(icon: StampIconKey, color: string): string {
  const markup = STAMP_ICON_PATHS[icon] ?? STAMP_ICON_PATHS.custom;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="${color}" color="${color}" opacity="0.16" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function MemberCard({
  card,
  className,
}: {
  card: MemberCardData;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const { bg, fg } = card;
  // Unikt pr. kort: samme butik vises flere gange paa siden (ogsaa skjult paa
  // mobil), og delte gradient-id'er kan give tomme kort.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
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
      {card.art ? (
        <>
          <ArtLayer id={`kk-${uid}`} art={card.art} bg={bg} fg={fg} accent={card.accent ?? fg} />
          {/* Blød bund, saa felterne altid kan laeses (som i Wallet). */}
          <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bg}00 52%, ${bg}e6 100%)` }} />
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

/** Eksempelkort fra forskellige brancher med tegnede motiver eller moenster (ingen fotos af mennesker). */
export const CARDS: Record<string, MemberCardData> = {
  cafe: {
    shop: "Kaffestuen",
    icon: "coffee",
    bg: "#14110F",
    fg: "#FFFFFF",
    art: "aurora",
    accent: "#C8743A",
    title: "Stamkunde",
    stamps: { n: 7, of: 10 },
    corner: { label: "Stempler", value: "7 af 10" },
    foot: { label: "Belønning", value: "10. kop er gratis" },
  },
  salon: {
    shop: "Salon Nord",
    icon: "scissors",
    bg: "#2B1F2A",
    fg: "#F6E8F0",
    art: "rings",
    accent: "#D98BB5",
    title: "Henvis en ven",
    corner: { label: "Din kode", value: "EMMA-K7" },
    foot: { label: "Til gode", value: "Gratis klip" },
  },
  blomster: {
    shop: "Blomsterhuset",
    icon: "flower",
    bg: "#1F2A1C",
    fg: "#F3F0E2",
    art: "hills",
    accent: "#7FA86B",
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
    bg: "#14213D",
    fg: "#FDF3E1",
    art: "sun",
    accent: "#E07A3F",
    title: "Stamgæst",
    stamps: { n: 6, of: 10 },
    corner: { label: "Stempler", value: "6 af 10" },
    foot: { label: "Belønning", value: "Én på huset" },
  },
  museum: {
    shop: "Kunstmuseet",
    icon: "book",
    bg: "#EDE6DA",
    fg: "#2E2A25",
    art: "arches",
    accent: "#B9895B",
    title: "Medlem",
    stamps: { n: 3, of: 5 },
    corner: { label: "Besøg", value: "3 af 5" },
    foot: { label: "Belønning", value: "Gratis entré" },
  },
  havn: {
    shop: "Havnekiosken",
    icon: "icecream",
    bg: "#0E3B52",
    fg: "#EAF6FB",
    art: "waves",
    accent: "#4FB3D9",
    title: "Henvis en ven",
    corner: { label: "Til gode", value: "50 kr." },
    foot: { label: "Vennen får", value: "En gratis is" },
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
