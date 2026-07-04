import type { StampIconKey } from "@/lib/brand";

// Tynde line-art ikoner i Alius-stil. Bruger currentColor, saa foraeldren
// styrer farven (kortets tekstfarve).

export function StampIcon({
  icon,
  className,
}: {
  icon: StampIconKey;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "coffee":
      return (
        <svg {...common}>
          <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
          <path d="M16 9h2.5a2 2 0 0 1 0 4H16" />
          <path d="M8 3.5c-.4.7-.4 1.3 0 2M11.5 3.5c-.4.7-.4 1.3 0 2" />
        </svg>
      );
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="6" cy="7" r="2.2" />
          <circle cx="6" cy="17" r="2.2" />
          <path d="M8 8.5 20 17M8 15.5 20 7" />
        </svg>
      );
    case "croissant":
      return (
        <svg {...common}>
          <path d="M4 15c3 1 6 1 8-1s2-5 1-8c2 1 4 3 5 6 1 3 0 6-3 7-4 1-9-.5-11-4Z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16.9 7.4 18.2l.9-5.2L4.5 9.3l5.2-.7L12 4Z" />
        </svg>
      );
    case "custom":
    default:
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
  }
}
