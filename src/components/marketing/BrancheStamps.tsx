// Hero-animation til branchesiderne: en raekke stempler, der popper ind eet ad
// gangen (branchens eget ikon), og ender i belOnningen. Ren CSS (stampPop-
// keyframe + staggered animation-delay), saa det er en server-komponent uden
// klient-JS. Respekterer prefers-reduced-motion via .branche-stamp i globals.css.
// "Taler til maalgruppen": frisoeren ser sakse, baristaen kopper, salonen hjerter.

type IconKey = "coffee" | "scissors" | "heart" | "pizza";

// Ikon-stier laant fra stempel-gitteret (strip.ts), saa sproget er det samme.
const ICONS: Record<IconKey, React.ReactNode> = {
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
  icon: IconKey;
  count?: number;
}) {
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
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.35rem] w-[1.35rem]"
            >
              {isGift ? GIFT : ICONS[icon]}
            </svg>
          </span>
        );
      })}
    </div>
  );
}
