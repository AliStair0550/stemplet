import Link from "next/link";
import {
  CtaArrow,
  IconDesign,
  IconDevice,
  IconQr,
  IconShare,
  IconStampMark,
} from "./icons";

// Foerste-gangs-guide: visuel og let at skimme. Fire trin som ikon-kort, minimal
// tekst. Vises paa overblikket indtil foerste stempel, og altid via "Kom i gang".
const STEPS = [
  {
    icon: <IconDesign />,
    title: "Tjek dit kort",
    body: "Navn, farver og belønning",
    href: "/app/kort",
  },
  {
    icon: <IconQr />,
    title: "Hent QR og skilte",
    body: "Sæt op ved kassen",
    href: "/app/materialer",
  },
  {
    icon: <IconShare />,
    title: "Del kortet",
    body: "På Instagram og Facebook",
    href: "/app/kampagner",
  },
  {
    icon: <IconStampMark />,
    title: "Giv et stempel",
    body: "Scan kundens kort",
    href: "/app/kasse",
  },
];

export function GettingStarted() {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-terracotta/30 bg-white shadow-card">
      <div className="border-b border-fog bg-terracotta/[0.05] px-6 py-5 md:px-8">
        <h2 className="font-[400] text-[1.2rem] text-ink">Kom godt i gang</h2>
      </div>

      <div className="grid gap-px bg-fog sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Link
            key={s.title}
            href={s.href}
            className="group flex flex-col gap-3 bg-white p-6 transition-colors hover:bg-sand/40"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                {s.icon}
              </span>
              <span className="font-fraunces text-[1.1rem] font-light italic text-terracotta/60">
                {i + 1}
              </span>
            </div>
            <span className="flex items-center gap-1.5 font-[400] text-[1rem] text-ink">
              {s.title}
              <span className="text-terracotta transition-transform group-hover:translate-x-0.5">
                <CtaArrow />
              </span>
            </span>
            <span className="font-[300] text-[0.83rem] leading-relaxed text-stone">
              {s.body}
            </span>
          </Link>
        ))}
      </div>

      <div className="border-t border-fog px-6 py-4 md:px-8">
        <Link
          href="/app/indstillinger#kasse-enheder"
          className="inline-flex items-center gap-2 text-[0.82rem] font-[300] text-stone transition-colors hover:text-ink"
        >
          <span className="text-terracotta">
            <IconDevice />
          </span>
          Skal personalet også stemple? Par en kasse-enhed
          <span className="text-terracotta">
            <CtaArrow />
          </span>
        </Link>
      </div>
    </div>
  );
}
