import { StampIcon } from "@/components/StampIcon";

// Relations-visuelt: din forretning i centrum (loyalitet), forbundet til
// kunder, der kommer igen. Glødende linjer flyder ind mod midten, en langsom
// bane kredser om centrum, og en puls viser, at du bliver set. Ren CSS -
// reduceret bevægelse respekteres via globals.css.
const NODES = [
  { x: 50, y: 11, d: 0 },
  { x: 87, y: 37, d: 0.6 },
  { x: 73, y: 83, d: 1.1 },
  { x: 27, y: 83, d: 0.3 },
  { x: 13, y: 37, d: 0.85 },
];

function PersonGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-moss">
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6s7.4 2.6 7.4 6.6z" />
    </svg>
  );
}

export function RelationshipGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[21rem]">
      {/* Blødt baggrundsskær */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/12 blur-3xl"
      />

      {/* Forbindelser + kredsende bane */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient
            id="relLine"
            gradientUnits="userSpaceOnUse"
            cx="50"
            cy="50"
            r="42"
          >
            <stop offset="0%" stopColor="#2D5F4A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2D5F4A" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {/* langsomt kredsende bane */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="#2D5F4A"
          strokeOpacity="0.25"
          strokeWidth="0.5"
          strokeDasharray="1 4"
          style={{
            transformOrigin: "50px 50px",
            animation: "spinSlow 34s linear infinite",
          }}
        />

        {NODES.map((n, i) => (
          <line
            key={i}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="url(#relLine)"
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeDasharray="2 5"
            style={{
              animation: "dashFlow 1.5s linear infinite",
              animationDelay: `${n.d}s`,
            }}
          />
        ))}
      </svg>

      {/* Kunde-noder (mennesker, der kommer igen) */}
      {NODES.map((n, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <div className="animate-float" style={{ animationDelay: `${n.d}s` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment shadow-[0_5px_16px_-5px_rgba(26,26,26,0.35)] ring-1 ring-moss/25">
              <PersonGlyph />
            </div>
          </div>
        </div>
      ))}

      {/* Centrum: din forretning, loyalitet der bliver set */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/20 blur-md"
        />
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out infinite" }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out 1.5s infinite" }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-moss text-parchment shadow-[0_12px_34px_-8px_rgba(45,95,74,0.7)] ring-1 ring-white/10">
          <StampIcon icon="heart" className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
