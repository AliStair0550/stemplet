import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-fog">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="font-[400] text-[1rem] tracking-[0.02em] text-ink">
              Stemplet<span className="text-moss">.</span>
            </span>
            <span className="font-[200] text-[0.7rem] tracking-[0.02em] text-stone">
              Stempelkortet, der skaber flere gensyn.
            </span>
          </div>

          <nav className="flex items-center gap-7">
            <Link
              href="/login"
              className="font-[300] text-[0.72rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Log ind
            </Link>
            <Link
              href="/start"
              className="font-[300] text-[0.72rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Kom i gang
            </Link>
            <a
              href="https://alius.dk"
              target="_blank"
              rel="noreferrer"
              className="font-[300] text-[0.72rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Alius
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t border-fog pt-6">
          <span className="font-[200] text-[0.7rem] tracking-[0.02em] text-stone">
            © 2026 Alius
          </span>
        </div>
      </div>
    </footer>
  );
}
