// De to haandtegnede streger under Henvisningers logo og ord. Egen fil uden
// skrifttype, saa logoet kan bruge dem overalt. Tegnes ind paa forsiden
// (hv-ink i forside.css); andre steder staar de bare.

/** Haandtegnet streg under et ord. */
export function Scribble({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 16" preserveAspectRatio="none" fill="none" className={`hv-ink ${className ?? ""}`}>
      <path d="M3 10 C 48 3, 112 2, 197 7" pathLength={1} stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
      <path d="M30 13 C 80 9, 130 9, 170 11" pathLength={1} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

