"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// Kommer ejeren fra Kom i gang (?fra=guide), staar der en tydelig vej tilbage
// oeverst paa siden, saa man aldrig skal lede efter guiden.
export function BackToGuide() {
  const params = useSearchParams();
  const pathname = usePathname();
  if (params.get("fra") !== "guide" || pathname === "/app") return null;
  return (
    <Link
      href="/app#kom-i-gang"
      className="mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#061C3D] px-4 text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#0A2D5A]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m15 6-6 6 6 6" />
      </svg>
      Tilbage til Kom i gang
    </Link>
  );
}
