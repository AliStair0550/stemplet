import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { StartWizard } from "./StartWizard";

export const metadata: Metadata = {
  title: "Kom gratis i gang",
  description: "Opret dit digitale stempelkort paa ti minutter. Intet kreditkort.",
};

export default function StartPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="border-b border-fog">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 md:px-8">
          <Wordmark />
          <span className="text-[0.7rem] font-[300] uppercase tracking-[0.12em] text-slate">
            Gratis. Intet kreditkort.
          </span>
        </div>
      </header>
      <div className="px-6 py-14 md:px-8 md:py-20">
        <StartWizard />
      </div>
    </main>
  );
}
