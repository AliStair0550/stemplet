import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Tjek din mail" };

export default function CheckMailPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Wordmark />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2D5F4A"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h1 className="font-[300] text-[1.4rem] text-ink">Tjek din mail</h1>
        <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
          Vi har sendt et login-link. Åbn mailen på denne enhed, så er du
          inde i dashboardet.
        </p>
      </div>
    </main>
  );
}
