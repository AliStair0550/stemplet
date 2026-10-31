"use client";

import type { ReactNode } from "react";
import { markCardSeen } from "./actions";

// "Se kortet" i Kom i gang: aabner kundesiden i en ny fane og krydser trinnet af.
export function SeeCardLink({ href, seen, className, children }: { href: string; seen: boolean; className?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={seen ? undefined : () => void markCardSeen().catch(() => {})}
      className={className}
    >
      {children}
    </a>
  );
}
