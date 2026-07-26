import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { ButtonLink } from "@/components/ui";

// Kvittering efter klik paa bekraeftelseslinket. noindex: ren transaktionsside
// uden SEO-vaerdi (og linket er /api-baseret, saa selve bekraeftelsen crawles ikke).
export const metadata: Metadata = {
  title: "Tilmelding bekræftet",
  robots: { index: false },
};

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string }>;
}) {
  const { fejl } = await searchParams;
  const failed = fejl === "1";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Wordmark />
        {failed ? (
          <>
            <h1 className="text-[1.6rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink">
              Linket virkede ikke
            </h1>
            <p className="text-[0.98rem] leading-[1.7] text-stone">
              Linket er ugyldigt eller allerede brugt på en anden måde. Skriv dig
              gerne op igen, så sender vi et nyt bekræftelseslink.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[1.6rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink">
              Tak. Din tilmelding er bekræftet.
            </h1>
            <p className="text-[0.98rem] leading-[1.7] text-stone">
              Vi holder kontakten. Du hører fra os, når vi har inspiration, idéer
              eller nye muligheder at dele. Ingen spam, kun gode idéer.
            </p>
          </>
        )}
        <ButtonLink href="/" variant="ink" size="md">
          Tilbage til forsiden
        </ButtonLink>
      </div>
    </main>
  );
}
