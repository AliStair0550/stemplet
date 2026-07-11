import { StampIcon } from "@/components/StampIcon";

// Relations-visuelt: din forretning i centrum (loyalitet), forbundet til
// kunder, der kommer igen. Forbindelseslinjer flyder, noderne trækker vejret,
// og en puls viser, at du bliver set. Ren CSS - reduceret bevægelse
// respekteres via globals.css.
const NODES = [
  { x: 50, y: 12, d: 0 },
  { x: 86, y: 38, d: 0.6 },
  { x: 72, y: 82, d: 1.1 },
  { x: 28, y: 82, d: 0.3 },
  { x: 14, y: 38, d: 0.85 },
];

export function RelationshipGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[21rem]">
      {/* Forbindelseslinjer */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {NODES.map((n, i) => (
          <line
            key={i}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="#2D5F4A"
            strokeOpacity={0.5}
            strokeWidth={0.6}
            strokeLinecap="round"
            strokeDasharray="2 5"
            style={{
              animation: "dashFlow 1.5s linear infinite",
              animationDelay: `${n.d}s`,
            }}
          />
        ))}
      </svg>

      {/* Kunde-noder */}
      {NODES.map((n, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <div className="animate-float" style={{ animationDelay: `${n.d}s` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment shadow-[0_4px_12px_-4px_rgba(26,26,26,0.3)] ring-1 ring-moss/30">
              <span className="h-2.5 w-2.5 rounded-full bg-moss" />
            </div>
          </div>
        </div>
      ))}

      {/* Centrum: din forretning, loyalitet der bliver set */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out infinite" }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out 1.5s infinite" }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-moss text-parchment shadow-[0_10px_30px_-8px_rgba(45,95,74,0.6)]">
          <StampIcon icon="heart" className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
