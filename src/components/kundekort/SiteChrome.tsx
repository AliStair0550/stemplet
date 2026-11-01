import Link from "next/link";
import { PLATFORM } from "@/lib/platform";

// Folka Korts faelles top og bund: forsiden, branchesiderne og andre offentlige
// sider bruger de samme, saa udseendet holder hele vejen (se DESIGN.md).

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark ? "/folka-logo-hvid.svg" : "/folka-logo.svg"} alt="Folka" width={189} height={105} className="h-8 w-auto" />
      <span className={dark ? "h-5 w-px bg-white/20" : "h-5 w-px bg-[#CAD2DD]"} aria-hidden />
      <span className={dark ? "text-[15px] font-medium text-white/80" : "text-[15px] font-medium text-[#5F6B7E]"}>Kort</span>
    </span>
  );
}

/** Lys topbjaelke til lyse sider (forsiden har sin egen over det moerke hero). */
export function LightHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E7ED] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-3 py-2 text-[13px] font-medium text-[#5F6B7E] transition-colors hover:text-[#0B1628] sm:px-4 sm:text-[14px]">
            Log ind
          </Link>
          <Link
            href="/start"
            className="rounded-full bg-[#061C3D] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#0A2D5A]"
          >
            Opret dit kort
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const cols: [string, [string, string][]][] = [
    [
      "Folka Kort",
      [
        ["/start", "Opret dit kort"],
        ["/login", "Log ind"],
        ["/brancher", "Brancher"],
      ],
    ],
    [
      "Om",
      [
        ["https://folka.dk/om", "Om Folka"],
        ["/handelsbetingelser", "Handelsbetingelser"],
        ["/privatliv", "Privatliv"],
        ["/databehandleraftale", "Databehandleraftale"],
      ],
    ],
  ];
  return (
    <footer className="bg-[#020B1C] text-white/60">
      <div className="mx-auto grid max-w-[1200px] gap-10 border-t border-white/10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark dark />
          <p className="mt-4 max-w-[22rem] text-[14px] leading-relaxed">
            Dit kort. Dine kunder. Din kanal.
          </p>
          <a href={`mailto:${PLATFORM.contactEmail}`} className="mt-4 inline-block text-[14px] text-white/80 hover:text-white">
            {PLATFORM.contactEmail}
          </a>
        </div>
        {cols.map(([head, links]) => (
          <div key={head}>
            <p className="text-[13px] font-semibold text-white/85">{head}</p>
            <ul className="mt-4 grid gap-2.5 text-[14px]">
              {links.map(([href, label]) => (
                <li key={href}>
                  {href.startsWith("http") ? (
                    <a href={href} className="hover:text-white">
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className="hover:text-white">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
