import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log ind",
  // Samme dashboard-manifest: foejer man login til hjemmeskaermen, aabner ikonet
  // i dashboardet (start_url /app), ikke forsiden.
  manifest: "/app-manifest",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string }>;
}) {
  const { fejl } = await searchParams;
  const notice =
    fejl === "onboarding"
      ? "Din butik er oprettet. Log ind her, så kommer du ind i dashboardet."
      : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wordmark />
          <h1 className="font-[300] text-[1.5rem] text-ink">Log ind</h1>
          <p className="font-[200] text-[0.9rem] leading-relaxed text-stone">
            Kun virksomheder logger ind. Vi sender et sikkert link til din
            e-mail.
          </p>
        </div>
        {notice ? (
          <p className="rounded-lg border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3 text-center text-[0.82rem] font-[300] leading-relaxed text-terracotta">
            {notice}
          </p>
        ) : null}
        <LoginForm />
        <p className="text-center text-[0.8rem] font-[200] text-slate">
          Har du ikke en konto endnu?{" "}
          <Link href="/start" className="text-terracotta hover:opacity-70">
            Kom gratis i gang
          </Link>
        </p>
      </div>
    </main>
  );
}
