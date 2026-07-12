import type { StampIconKey } from "@/lib/brand";

// Tynde line-art ikoner i Alius-stil. Bruger currentColor, så forældren
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
    case "pizza":
      return (
        <svg {...common}>
          <path d="M12 3c4 0 7.5 2.2 9 5.5L12 21 3 8.5C4.5 5.2 8 3 12 3Z" />
          <path d="M5 9.5c4-1.5 10-1.5 14 0" />
          <circle cx="10" cy="10.5" r="0.6" fill="currentColor" />
          <circle cx="13.5" cy="12.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "burger":
      return (
        <svg {...common}>
          <path d="M4 9.5c0-3 3.6-5 8-5s8 2 8 5" />
          <path d="M4 14h16M5 11h14" />
          <path d="M5 14c0 2.5 3 4 7 4s7-1.5 7-4" />
        </svg>
      );
    case "beer":
      return (
        <svg {...common}>
          <path d="M7 8h8v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8Z" />
          <path d="M15 10h2.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H15" />
          <path d="M7 8c-.5-2.5 1-4 2.5-3.5C10 3 11.5 3 12.5 4c1.2-.8 2.5.2 2.5 1.5 0 .9-.5 1.7-1 2.5" />
        </svg>
      );
    case "icecream":
      return (
        <svg {...common}>
          <path d="M8 10a4 4 0 0 1 8 0" />
          <path d="M7.5 11h9l-4.5 9-4.5-9Z" />
          <path d="M8.5 14h7" />
        </svg>
      );
    case "wine":
      return (
        <svg {...common}>
          <path d="M7 4h10c0 4-2 7-5 7S7 8 7 4Z" />
          <path d="M12 11v6M9 20h6" />
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
