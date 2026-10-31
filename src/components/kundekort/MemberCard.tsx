import { useId } from "react";
import type { StampIconKey } from "@/lib/brand";
import { StampIcon } from "@/components/StampIcon";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import { cn } from "@/lib/utils";
import { artMarkup, type Art } from "@/lib/card-art";

// Et medlemskort, som det ser ud i kundens Wallet (plakatformat): butikkens
// billede eller farve fylder kortet, og navn, felter og kode ligger ovenpaa.
// Ren visning til forsiden; tallene er eksempler.

/** En rigtig QR-kode (til kort.folka.dk), saa den ser aegte ud og kan scannes.
 *  Genereret een gang med qrcode ("https://kort.folka.dk", niveau M). */
const QR_ROWS = [
  "1111111011100110001111111",
  "1000001010000110101000001",
  "1011101011000110101011101",
  "1011101000001111101011101",
  "1011101011101110101011101",
  "1000001000011110101000001",
  "1111111010101010101111111",
  "0000000001110110100000000",
  "1001111110011010110010111",
  "0001000110010011000111110",
  "0111001011100001100101001",
  "0011000110111001000011111",
  "0111011110111000101100001",
  "1001100010000011110010010",
  "1101001011111001101011111",
  "1010110000010001000101101",
  "1011111111100011111110110",
  "0000000010011100100010110",
  "1111111010110000101010001",
  "1000001010101011100010011",
  "1011101011101111111110011",
  "1011101010100010011000011",
  "1011101001001010100011111",
  "1000001000000010001110111",
  "1111111010100111111001001",
];
const QR_SIZE = QR_ROWS.length;

// Hele koden som EEN sti af vandrette loeb (ikke et felt pr. modul): faa kanter,
// ingen haarfine saemme mellem nabofelter, og skarpt i alle stoerrelser og
// vinkler. Loebene overlapper en anelse lodret, saa raekkerne flyder sammen.
const QR_PATH = QR_ROWS.flatMap((row, y) =>
  [...row.matchAll(/1+/g)].map((m) => `M${m.index} ${y - 0.01}h${m[0].length}v1.02h-${m[0].length}z`),
).join("");

export function QrCode({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} className={cn("block h-full w-full fill-[#020B1C]", className)} aria-hidden>
      <path d={QR_PATH} />
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

export type { Art };

/**
 * Tegnet motiv i kortets egne farver. Tegningen bor i lib/card-art, saa forsiden,
 * Design og det rigtige Wallet-kort viser praecis det samme.
 */
export function ArtLayer({ id, art, bg, fg, accent }: { id: string; art: Art; bg: string; fg: string; accent: string }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 142"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: artMarkup(art, { bg, fg, accent }, id) }}
    />
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
  hideShop = false,
}: {
  card: MemberCardData;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Kun logoet oeverst, uden butiksnavnet (fx et lille kort, hvor navnet afkortes). */
  hideShop?: boolean;
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
          {hideShop ? null : <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">{card.shop}</span>}
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
