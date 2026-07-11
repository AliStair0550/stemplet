import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadGuideData } from "@/lib/guide";
import { GuideContent } from "@/components/guide/GuideContent";
import { PrintGuideButton } from "@/components/guide/PrintGuideButton";

export const dynamic = "force-dynamic";

// Offentlig, laese-kun personale-guide. Ingen foelsomme data: aldrig PIN,
// noegler eller kundedata, kun hvordan tingene virker.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadGuideData({ slug });
  return {
    title: data
      ? `Sådan virker det hos ${data.businessName}`
      : "Personale-guide",
    robots: { index: false },
  };
}

export default async function PublicGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadGuideData({ slug });
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 md:py-16">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-moss">
            Personale-guide
          </p>
          <h1 className="mt-2 text-[1.9rem] font-[300] leading-tight text-ink">
            Sådan virker det hos {data.businessName}
          </h1>
          <p className="mt-1.5 text-[1rem] font-[200] text-stone">
            Læs det på tre minutter.
          </p>
        </div>
        <PrintGuideButton />
      </header>

      <GuideContent data={data} />

      <footer className="mt-16 border-t border-fog pt-6 text-center text-[0.8rem] font-[300] tracking-[0.08em] text-slate print:hidden">
        Lavet med Stemplet
      </footer>
    </main>
  );
}
