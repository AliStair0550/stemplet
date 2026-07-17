"use client";

import { useEffect, useState } from "react";

// Konfetti-burst i Alius-farver. Fejrer et fuldt kort. Respekterer
// reduceret bevægelse (renderer intet). Ingen afhængigheder.
const COLORS = ["#A6502E", "#C77A52", "#B8923A", "#D4D0C8", "#1A1A1A"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rounded: boolean;
};

export function Celebration({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!show) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const next: Piece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 1,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 7,
      rounded: Math.random() > 0.5,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(t);
  }, [show]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.rounded ? p.size : p.size * 0.5}px`,
            background: p.color,
            borderRadius: p.rounded ? "9999px" : "1px",
            animation: `confettiFall ${p.duration}s cubic-bezier(0.2, 0.6, 0.4, 1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
