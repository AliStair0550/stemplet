import type { BrancheIcon } from "@/lib/brancher";

// Hero-animation til branchesiderne: en raekke stempler, der popper ind eet ad
// gangen (branchens eget ikon), og ender i belOnningen. Ren CSS (stampPop-
// keyframe + staggered animation-delay), saa det er en server-komponent uden
// klient-JS. Respekterer prefers-reduced-motion via .branche-stamp i globals.css.
// "Taler til maalgruppen": frisoeren ser sakse, baristaen kopper, isbutikken is.
// Et ikon-ARRAY (fx café: kaffe/vin/oel) skifter ikon pr. stempel = "hele dagen".

// Ikon-stier laant fra stempel-gitteret (strip.ts), saa sproget er det samme.
const ICONS: Record<BrancheIcon, React.ReactNode> = {
  coffee: (
    <>
      <path d="M6 8h9v4.5a4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5V8Z" />
      <path d="M15 9.3h2.2a2.3 2.3 0 0 1 0 4.6H15" />
      <path d="M6 19.6h9" />
      <path d="M8.6 2.7c-.5.8-.5 1.6 0 2.4M11.7 2.7c-.5.8-.5 1.6 0 2.4" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="6" cy="17" r="2.2" />
      <path d="M8 8.5 20 17M8 15.5 20 7" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z" />
  ),
  pizza: (
    <>
      <path d="M12 3c4 0 7.5 2.2 9 5.5L12 21 3 8.5C4.5 5.2 8 3 12 3Z" />
      <path d="M5 9.5c4-1.5 10-1.5 14 0" />
      <circle cx="10" cy="10.5" r="0.7" fill="#FAF8F4" stroke="none" />
      <circle cx="13.5" cy="12.5" r="0.7" fill="#FAF8F4" stroke="none" />
    </>
  ),
  croissant: (
    <path d="M4 15c3 1 6 1 8-1s2-5 1-8c2 1 4 3 5 6 1 3 0 6-3 7-4 1-9-.5-11-4Z" />
  ),
  icecream: (
    <>
      <path d="M8 10a4 4 0 0 1 8 0" />
      <path d="M7.5 11h9l-4.5 9-4.5-9Z" />
      <path d="M8.5 14h7" />
    </>
  ),
  wine: (
    <>
      <path d="M7 4h10c0 4-2 7-5 7S7 8 7 4Z" />
      <path d="M12 11v6M9 20h6" />
    </>
  ),
  beer: (
    <>
      <path d="M7 9h8v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Z" />
      <path d="M15 11h2a1.6 1.6 0 0 1 0 4h-2" />
      <path d="M7 9c-.3-1.9.7-3 1.9-2.6C9.5 5 10.9 5 11.7 5.9 12.9 5.2 14.1 6 14.1 7.2c0 .7-.3 1.3-.8 1.8" />
      <path d="M9.2 12.2v4.6M12 12.2v4.6" />
    </>
  ),
  flower: (
    <>
      <path d="M8.5 7c0 2.5 1.6 4.5 3.5 4.5S15.5 9.5 15.5 7c-1.3 0-2.5.7-3.5 2-1-1.3-2.2-2-3.5-2Z" />
      <path d="M12 11.5V19" />
      <path d="M12 15.4c-1.5 0-2.7-.9-3.2-2.3M12 15.4c1.5 0 2.7-.9 3.2-2.3" />
    </>
  ),
};

const GIFT = (
  <>
    <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
    <path d="M12 11v9M3 8h18v3H3z" />
    <path d="M12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8" />
  </>
);

export function BrancheStamps({
  icon,
  count = 5,
}: {
  icon: BrancheIcon | BrancheIcon[];
  count?: number;
}) {
  // Eet ikon overalt, eller et array der skifter pr. stempel (fx café).
  const iconAt = (i: number): BrancheIcon =>
    Array.isArray(icon) ? icon[i % icon.length] : icon;
  return (
    <div
      aria-hidden
      className="flex items-center justify-center gap-2.5 sm:gap-3.5"
    >
      {Array.from({ length: count }).map((_, i) => {
        const isGift = i === count - 1;
        return (
          <span
            key={i}
            className="branche-stamp flex h-11 w-11 items-center justify-center rounded-full shadow-card sm:h-12 sm:w-12"
            style={{
              animationDelay: `${0.15 + i * 0.16}s`,
              background: isGift ? "#C9A24B" : "var(--color-terracotta)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FAF8F4"
              strokeWidth={2.05}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.5rem] w-[1.5rem]"
            >
              {isGift ? GIFT : ICONS[iconAt(i)]}
            </svg>
          </span>
        );
      })}
    </div>
  );
}
