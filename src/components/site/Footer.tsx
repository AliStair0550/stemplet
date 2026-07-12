import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/#sådan", label: "Sådan virker det" },
  { href: "/#pris", label: "Pris" },
  { href: "/start", label: "Kom gratis i gang" },
  { href: "/login", label: "Log ind" },
];

export default function Footer() {
  return (
    <footer className="border-t border-fog bg-parchment">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr] md:gap-16">
          {/* Brand + mission */}
          <div className="flex flex-col gap-5">
            <span className="font-[400] text-[1.15rem] tracking-[0.02em] text-ink">
              Stemplet<span className="text-moss">.</span>
            </span>
            <p className="max-w-md font-[200] text-[0.9rem] leading-[1.9] text-stone">
              De mindste forretninger har de mest loyale kunder. De har bare
              aldrig haft værktøjerne til at vise det. Stemplet er digital
              loyalitet til caféen, barberen og bageren, gratis at begynde, og
              altid i butikkens eget brand.
            </p>
            <Image
              src="/stemplet-badge-moss.png"
              alt="Stemplet"
              width={64}
              height={64}
              className="mt-1 h-14 w-14"
            />
          </div>

          {/* Genveje */}
          <nav className="flex flex-col gap-3.5 md:items-end">
            <span className="mb-1 text-[0.62rem] font-[400] uppercase tracking-[0.14em] text-slate">
              Genveje
            </span>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-[300] text-[0.85rem] tracking-[0.01em] text-stone transition-colors hover:text-moss"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-fog pt-6">
          <span className="font-[200] text-[0.72rem] tracking-[0.02em] text-slate">
            © 2026 Stemplet
          </span>
          <a
            href="https://alius.dk"
            target="_blank"
            rel="noreferrer"
            className="font-[300] text-[0.72rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
          >
            Drevet af Alius
          </a>
        </div>
      </div>
    </footer>
  );
}
