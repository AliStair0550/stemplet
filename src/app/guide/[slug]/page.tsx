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
    <main className="dash-theme min-h-screen bg-parchment">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.85rem] font-medium text-stone">
              Service
            </p>
            <h1 className="mt-1 text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink">
              Sådan virker det hos {data.businessName}
            </h1>
          </div>
          <PrintGuideButton />
        </header>

        <GuideContent data={data} />

        <footer className="mt-16 border-t border-fog pt-6 text-center text-[0.8rem] text-slate print:hidden">
          Folka Kort
        </footer>
      </div>
    </main>
  );
}
