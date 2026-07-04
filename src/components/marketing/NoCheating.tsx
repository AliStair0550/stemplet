import { Section } from "@/components/ui";

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M20 11a8 8 0 0 0-14.3-4.5M5 4v3h3" />
      <path d="M4 13a8 8 0 0 0 14.3 4.5M19 20v-3h-3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1" />
    </svg>
  );
}

const POINTS = [
  {
    icon: <ShieldIcon />,
    title: "Signerede engangsstempler",
    body: "Hvert stempel er kryptografisk signeret. Det kan kun bruges én gang og kan ikke kopieres.",
  },
  {
    icon: <RotateIcon />,
    title: "Roterende QR-kode",
    body: "Koden skifter løbende. Et gammelt skærmbillede fra en anden gang virker ikke.",
  },
  {
    icon: <LockIcon />,
    title: "Personale-PIN ved indløsning",
    body: "Belønninger frigives kun med personalets PIN. Kunden kan ikke selv løse ind.",
  },
];

export default function NoCheating() {
  return (
    <Section className="bg-moss text-parchment">
      <div className="max-w-xl">
        <span className="font-[400] text-[0.65rem] uppercase tracking-[0.12em] text-parchment/60">
          Sikkerhed
        </span>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-parchment">
          Ingen kan snyde systemet.
        </h2>
        <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-parchment/70">
          Et digitalt stempel er ikke bare pænere. Det er sværere at forfalske
          end noget gummistempel.
        </p>
      </div>

      <div className="mt-14 grid border-y border-parchment/15 md:grid-cols-3">
        {POINTS.map((p, i) => (
          <div
            key={p.title}
            className={`py-9 md:px-9 ${
              i < POINTS.length - 1
                ? "border-b border-parchment/15 md:border-b-0 md:border-r"
                : ""
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-parchment/25 text-parchment">
              {p.icon}
            </div>
            <h3 className="mt-6 font-[400] text-[1.1rem] tracking-[0.02em] text-parchment">
              {p.title}
            </h3>
            <p className="mt-3 font-[200] text-[0.88rem] leading-[1.75] text-parchment/70">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
