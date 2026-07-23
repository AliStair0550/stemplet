import type { BrancheIcon } from "@/lib/brancher";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";

// Hero-animation til branchesiderne: en raekke stempler, der popper ind eet ad
// gangen (branchens eget ikon), og ender i belOnningen. Ren CSS (stampPop-
// keyframe + staggered animation-delay), saa det er en server-komponent uden
// klient-JS. Respekterer prefers-reduced-motion via .branche-stamp i globals.css.
// "Taler til maalgruppen": frisoeren ser sakse, baristaen kopper, isbutikken is.
// Et ikon-ARRAY (fx café: kaffe/vin/oel) skifter ikon pr. stempel = "hele dagen".
// Ikon-stierne kommer fra den delte kilde (stamp-icon-paths), samme som kortet.

// Gave-ikon til det sidste stempel (belOnningen).
const GIFT =
  '<path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z"/><path d="M12 11v9M3 8h18v3H3z"/><path d="M12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8"/>';

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
        const markup = isGift ? GIFT : STAMP_ICON_PATHS[iconAt(i)];
        return (
          <span
            key={i}
            className="branche-stamp flex h-11 w-11 items-center justify-center rounded-full shadow-card sm:h-12 sm:w-12"
            style={{
              animationDelay: `${0.15 + i * 0.16}s`,
              background: isGift ? "#C9A24B" : "var(--color-terracotta)",
            }}
          >
            {/* color styrer baade streg og de faa fill=currentColor detaljer, saa
                ikonet altid staar lyst paa chippen. */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.05}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.5rem] w-[1.5rem]"
              style={{ color: "#FAF8F4" }}
              dangerouslySetInnerHTML={{ __html: markup }}
            />
          </span>
        );
      })}
    </div>
  );
}
