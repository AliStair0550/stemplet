import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { FindCardForm } from "./FindCardForm";

export const metadata: Metadata = {
  title: "Find dit kort",
  robots: { index: false },
};

export default function FindCardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Wordmark />
          <div>
            <h1 className="font-[300] text-[1.5rem] leading-tight text-ink">
              Find dit kort
            </h1>
            <p className="mt-1.5 max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
              Har du fået ny telefon eller mistet dit kort? Skriv serienummeret,
              så henter vi det frem med alle dine stempler.
            </p>
          </div>
        </div>

        <FindCardForm />

        <p className="text-center text-[0.78rem] font-[200] leading-relaxed text-slate">
          Kan du ikke finde nummeret? Spørg personalet i butikken, de kan slå
          dit kort op.
        </p>
      </div>
    </main>
  );
}
