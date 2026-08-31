// Smaa line-art ikoner delt af overblik, kom-i-gang-guiden m.fl.
const ICON = "h-[1.15rem] w-[1.15rem]";
const ICON_LG = "h-[1.3rem] w-[1.3rem]";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconUsers() {
  return (
    <svg {...svgProps} className={ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  );
}
export function IconSpark() {
  return (
    <svg {...svgProps} className={ICON}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}
export function IconStamp() {
  return (
    <svg {...svgProps} className={ICON}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9.5 9l1.7 1.7L15 7" />
      <path d="M5 20h14" />
    </svg>
  );
}
// Selve "stempel"-glyfen (fluebenet der lander med en linje under). EEN kilde,
// saa menuens Stempel-knap og "Giv et stempel" altid ser ens ud.
export function IconStampMark({ className = ICON }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4.5 11.5l4.2 4.2L19 5.5" strokeWidth={2.6} />
      <path d="M4 20.5h16" strokeWidth={1.6} />
    </svg>
  );
}
export function IconGift() {
  return (
    <svg {...svgProps} className={ICON}>
      <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
      <path d="M12 11v9M3 8h18v3H3zM12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8" />
    </svg>
  );
}
export function IconQr() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h3v3M20 14v.01M17 20h3v-3M14 20h.01" />
    </svg>
  );
}
export function IconShare() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8 15.8 6.4M8.2 13.2l7.6 4.4" />
    </svg>
  );
}
export function IconDesign() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M13.5 10.5h4M13.5 14h4" />
    </svg>
  );
}
export function IconDevice() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

export function IconChart() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M8 15l3.5-4 3 2.5L20 7" />
    </svg>
  );
}
export function IconKey() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H20M17 12v3M14 12v2.5" />
    </svg>
  );
}
export function IconCard() {
  return (
    <svg {...svgProps} className={ICON_LG}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M6.5 14.5h4" />
    </svg>
  );
}

export const CTA =
  "inline-flex items-center gap-1.5 text-[0.74rem] font-[400] uppercase tracking-[0.08em] text-terracotta transition-opacity hover:opacity-70";

export function CtaArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
