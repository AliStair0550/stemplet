import { Nothing_You_Could_Do } from "next/font/google";
export { Scribble } from "./Scribble";

// Henvisningers signatur paa forsiden: logoets haandskrift (Nothing You Could Do,
// OFL) brugt som smaa noter med pile, som en seddel fra en ven. Anbefalinger er
// mund til mund; siden skal foeles saadan. Skriften hostes selv via next/font og
// indlaeses kun paa denne side. Pilene tegnes, naar scenen er synlig (hv-ink i
// forside.css, styret af Play).

export const hand = Nothing_You_Could_Do({ weight: "400", subsets: ["latin"], display: "swap" });

const ARROWS = {
  "down-left": ["M110 8 C 80 10, 42 24, 18 64", "M18 64 l 1 -15 M18 64 l 14 -5"],
  "down-right": ["M10 8 C 40 10, 78 24, 102 64", "M102 64 l -1 -15 M102 64 l -14 -5"],
  left: ["M112 30 C 84 8, 44 58, 10 38", "M10 38 l 13 -9 M10 38 l 14 5"],
  right: ["M8 30 C 36 8, 76 58, 110 38", "M110 38 l -13 -9 M110 38 l -14 5"],
  down: ["M40 6 C 20 26, 70 40, 50 72", "M50 72 l -10 -11 M50 72 l 12 -8"],
} as const;

export type ArrowDir = keyof typeof ARROWS;

export function Arrow({ dir, className }: { dir: ArrowDir; className?: string }) {
  const [line, head] = ARROWS[dir];
  return (
    <svg aria-hidden viewBox="0 0 120 80" fill="none" className={`hv-ink ${className ?? ""}`}>
      <path d={line} pathLength={1} stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      <path d={head} pathLength={1} stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** En haandskreven note med pil. Placeres absolut af kalderen. */
export function Note({
  children,
  arrow,
  className,
  arrowClassName,
  rotate = -4,
}: {
  children: React.ReactNode;
  arrow?: ArrowDir;
  className?: string;
  arrowClassName?: string;
  rotate?: number;
}) {
  return (
    <div aria-hidden className={`pointer-events-none ${className ?? ""}`}>
      <p
        className={`${hand.className} hv-ink-text whitespace-nowrap text-[26px] leading-none`}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {children}
      </p>
      {arrow ? <Arrow dir={arrow} className={`mt-1 h-[54px] w-[84px] ${arrowClassName ?? ""}`} /> : null}
    </div>
  );
}

/** Haandtegnet flueben, som i app-ikonet. */
export function HandTick({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={`hv-ink ${className ?? ""}`}>
      <path
        d="M3 13.5c2.2 1.4 4 3.3 5.6 5.8C11.4 12.6 15.6 7.4 21 3.6"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
