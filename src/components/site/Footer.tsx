import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/Wordmark";

const LINKS = [
  { href: "/#sådan", label: "Sådan virker det" },
  { href: "/#pris", label: "Pris" },
  { href: "/start", label: "Kom gratis i gang" },
  { href: "/login", label: "Log ind" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-parchment">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr] md:gap-16">
          {/* Brand + mission */}
          <div className="flex flex-col gap-5">
            <Wordmark href="/" tone="light" className="text-[1.25rem]" />
            <p className="max-w-md text-[0.95rem] leading-[1.7] text-parchment/65">
              <span className="text-parchment">
                Stempelkortet, der skaber flere gensyn.
              </span>
              <br />
              Den klassiske loyalitetsidé får nu et digitalt hjem. Altid ved
              hånden i Apple Wallet. Ingen app. Ingen tilmelding. Indsigt i
              statistik og købsmønstre.
            </p>
            <Image
              src="/stemplet-appikon.png"
              alt="Stemplet"
              width={44}
              height={44}
              className="mt-1 h-11 w-11 rounded-[10px]"
            />
          </div>

          {/* Genveje */}
          <nav className="flex flex-col gap-3.5 md:items-end">
            <span className="mb-1 text-label font-medium uppercase tracking-[0.08em] text-parchment/45">
              Genveje
            </span>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[0.9rem] text-parchment/65 transition-colors hover:text-parchment"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:hej@alius.dk"
              className="text-[0.9rem] text-parchment/65 transition-colors hover:text-parchment"
            >
              Kontakt: hej@alius.dk
            </a>
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-parchment/10 pt-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[0.75rem] text-parchment/45">© 2026 Stemplet</span>
            <Link
              href="/handelsbetingelser"
              className="text-[0.75rem] text-parchment/45 transition-colors hover:text-parchment"
            >
              Handelsbetingelser
            </Link>
            <Link
              href="/privatliv"
              className="text-[0.75rem] text-parchment/45 transition-colors hover:text-parchment"
            >
              Privatliv
            </Link>
            <Link
              href="/databehandleraftale"
              className="text-[0.75rem] text-parchment/45 transition-colors hover:text-parchment"
            >
              Databehandleraftale
            </Link>
          </div>
          <a
            href="https://alius.dk"
            target="_blank"
            rel="noreferrer"
            className="text-label uppercase tracking-[0.08em] text-parchment/45 transition-colors hover:text-parchment"
          >
            Drevet af Alius
          </a>
        </div>
      </div>
    </footer>
  );
}
