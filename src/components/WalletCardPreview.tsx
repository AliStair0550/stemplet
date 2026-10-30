"use client";

import { StampCard } from "./StampCard";
import { StampIcon } from "./StampIcon";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import { photoPalette, shade, type StampIconKey } from "@/lib/brand";
import { CARD_ACTION_LABEL, headerShows, type CardAction, type CardStyle } from "@/lib/card-look";
import { artDataUri, type Art } from "@/lib/card-art";

// Forhaandsvisning af Wallet-kortet i dashboardet (siden Kortet): plakatkortet
// paa iOS 27 og det klassiske kort, som aeldre iPhones faar. Viser butikkens
// rigtige farver, logo, ikon og regler med en eksempelkunde. Ren visning.

export type PreviewProduct = "stemplet" | "begge" | "henvisninger";

export type WalletCardPreviewProps = {
  os: "27" | "old";
  style: CardStyle;
  artwork: string | null;
  /** Motiv og accent til stilen "Motiv" (accent null = automatisk). */
  art?: Art;
  accent?: string | null;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  /** Oeverst paa kortet: logo, navn eller begge (standard: logo, ellers navn). */
  header?: string;
  name: string;
  stampIcon: StampIconKey;
  stampsRequired: number;
  rewardText: string;
  product: PreviewProduct;
  /** Fx "100 kr." (vennens rabat) og "gratis klip" (kundens beloenning). */
  friendReward: string;
  referrerReward: string;
  actions: CardAction[];
  /** Vis disse i stedet for eksempelkunden (fx butikssiden: 0 stempler). */
  sampleStamps?: number;
  /** Et nyt kort (butikssiden): intet til gode endnu. */
  fresh?: boolean;
};

const EXAMPLE_STAMPS = 3;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Field({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.09em] opacity-70">{label}</div>
      <div className={big ? "truncate text-[22px] font-bold tracking-[0.01em]" : "truncate text-[16px] font-bold leading-tight"}>
        {value}
      </div>
    </div>
  );
}

function Grid({ n, of, icon, fg, bg }: { n: number; of: number; icon: StampIconKey; fg: string; bg: string }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: of }, (_, i) => (
        <span
          key={i}
          className="flex aspect-square items-center justify-center rounded-full"
          style={i < n ? { background: fg, color: bg } : { border: `1.5px solid ${fg}55`, color: fg }}
        >
          {i < n ? <StampIcon icon={icon} className="h-[55%] w-[55%]" /> : null}
        </span>
      ))}
    </div>
  );
}

function artworkStyle(p: WalletCardPreviewProps): React.CSSProperties {
  if (p.style === "photo" && p.artwork) {
    return {
      backgroundImage: `linear-gradient(180deg, transparent 45%, ${p.primaryColor}e6 92%), url(${p.artwork})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (p.style === "art") {
    return {
      backgroundColor: p.primaryColor,
      backgroundImage: artDataUri(p.art ?? "aurora", { bg: p.primaryColor, fg: p.textColor, accent: p.accent }),
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (p.style === "pattern") {
    const markup = STAMP_ICON_PATHS[p.stampIcon] ?? STAMP_ICON_PATHS.custom;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${p.textColor}" color="${p.textColor}" opacity="0.2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
    // Moensteret toner ud mod toppen, saa navn/logo og stempler staar frit (som i Wallet).
    return {
      background: `linear-gradient(180deg, ${p.primaryColor} 17%, ${p.primaryColor}00 32%), url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 44px 44px, ${p.primaryColor}`,
    };
  }
  return { background: p.primaryColor };
}

function Qr({ size }: { size: number }) {
  const on = [1,1,1,0,1,1,1, 1,0,1,0,1,0,1, 1,1,1,1,1,1,1, 0,1,0,1,0,1,0, 1,1,1,0,1,0,1, 1,0,1,1,1,1,0, 1,1,1,0,1,0,1];
  return (
    <span className="grid shrink-0 grid-cols-7 gap-px rounded-[7px] bg-white p-[5px]" style={{ width: size, height: size }} aria-hidden>
      {on.map((v, i) => (
        <b key={i} className={v ? "bg-[#111]" : "bg-white"} />
      ))}
    </span>
  );
}

function Poster(p: WalletCardPreviewProps) {
  const fg = p.textColor;
  const n = p.sampleStamps ?? EXAMPLE_STAMPS;
  const owed = p.fresh ? "Intet endnu" : cap(p.referrerReward);
  const stamps = p.product !== "henvisninger";
  const refs = p.product !== "stemplet";
  const header = stamps
    ? { label: "Stempler", value: `${n}/${p.stampsRequired}` }
    : { label: "Til gode", value: owed };
  const shows = headerShows(p.header, !!p.logoUrl);
  return (
    <div
      className="relative isolate aspect-[300/430] w-full max-w-[300px] overflow-hidden rounded-[18px] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.5)]"
      style={{ ...artworkStyle(p), color: fg }}
    >
      {/* Som i Wallet: Apple laegger en bloed moerk skygge oeverst paa plakatkortet. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[38%]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0))" }} />
      <div className="relative flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {shows.logo && p.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logoUrl} alt="" className="h-[30px] w-auto max-w-[126px] shrink-0 object-contain object-left" />
          ) : null}
          {shows.name ? <span className="truncate text-[15px] font-extrabold tracking-[-0.02em]">{p.name}</span> : null}
        </div>
        <div className="text-right">
          <Field label={header.label} value={header.value} />
        </div>
      </div>
      {p.style === "stamps" && stamps ? (
        <div className="absolute inset-x-4 top-[72px]">
          <Grid n={n} of={p.stampsRequired} icon={p.stampIcon} fg={fg} bg={p.primaryColor} />
        </div>
      ) : p.style === "color" ? (
        <div className="absolute inset-x-4 top-[78px] text-[38px] font-extrabold leading-[0.95] tracking-[-0.04em]">
          {p.name}
        </div>
      ) : null}
      <div
        className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto] items-end gap-x-3.5 gap-y-2.5 px-4 pb-4 pt-3.5"
        // Som i Wallet: feltbaandet i bunden er taet og en anelse dybere end kortet.
        style={{ background: shade(p.primaryColor, -0.08) }}
      >
        <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2">
          {p.product === "henvisninger" ? (
            <div className="col-span-2">
              <Field label="Del med en ven" value={`Giv ${p.friendReward}`} big />
            </div>
          ) : refs ? (
            <>
              <Field label="Del med en ven" value={`Giv ${p.friendReward}`} />
              <Field label="Til gode" value={owed} />
            </>
          ) : (
            <div className="col-span-2">
              <Field label="Belønning" value={p.rewardText} />
            </div>
          )}
        </div>
        <Qr size={54} />
        <div className="col-span-2 border-t pt-2 text-[11px] opacity-80" style={{ borderColor: `${fg}38` }}>
          {p.product === "henvisninger"
            ? `Du får ${p.referrerReward}, når din ven har været her`
            : refs
              ? `Belønning: ${p.rewardText}`
              : `${p.stampsRequired - n} stempler til næste belønning`}
        </div>
      </div>
    </div>
  );
}

function Classic(p: WalletCardPreviewProps) {
  if (p.product !== "henvisninger") {
    return (
      <div className="w-full max-w-[300px]">
        <StampCard
          businessName={p.name}
          logoUrl={p.logoUrl}
          primaryColor={p.primaryColor}
          textColor={p.textColor}
          stampIcon={p.stampIcon}
          stamps={p.sampleStamps ?? EXAMPLE_STAMPS}
          required={p.stampsRequired}
          rewardText={p.rewardText}
          landscape
        />
      </div>
    );
  }
  return (
    <div
      className="w-full max-w-[300px] rounded-[14px] px-4 py-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.5)]"
      style={{ background: p.primaryColor, color: p.textColor }}
    >
      <span className="text-[15px] font-extrabold">{p.name}</span>
      <div className="mt-5">
        <Field label="Del med en ven" value={`Giv ${p.friendReward}`} big />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Du får" value={p.referrerReward} />
        <Field label="Til gode" value={p.fresh ? "Intet endnu" : cap(p.referrerReward)} />
      </div>
      <div className="mt-5 flex justify-center">
        <Qr size={70} />
      </div>
    </div>
  );
}

export function WalletCardPreview(props: WalletCardPreviewProps) {
  // Eget billede: lys tekst paa fotoet, ogsaa med et lyst tema (som i Wallet).
  const p =
    props.style === "photo" && props.artwork
      ? { ...props, ...photoPalette(props.primaryColor, props.textColor) }
      : props;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {p.os === "27" ? <Poster {...p} /> : <Classic {...p} />}
      {p.os === "27" && p.actions.length > 0 ? (
        <div className="w-full max-w-[300px]">
          <p className="mb-1.5 text-center text-[0.72rem] text-slate">Knapper under kortet i Wallet</p>
          <div className="grid grid-cols-2 gap-2">
            {p.actions.map((a) => (
              <div key={a} className="flex min-w-0 items-center gap-2 rounded-[14px] bg-[#f5f5f7] px-3 py-2.5 text-[12.5px] font-semibold text-[#111]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111] text-[11px] text-white">
                  {a === "book" ? "◷" : "★"}
                </span>
                <span className="leading-tight">{CARD_ACTION_LABEL[a]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
