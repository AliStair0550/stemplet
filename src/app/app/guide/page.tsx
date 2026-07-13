import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { loadGuideData } from "@/lib/guide";
import { PageHeading } from "@/components/dash";
import { GuideContent } from "@/components/guide/GuideContent";
import { PrintGuideButton } from "@/components/guide/PrintGuideButton";
import { CopyInline } from "@/components/CopyInline";
import { APP_URL } from "@/lib/env";

export const metadata: Metadata = { title: "Sådan virker det" };
export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const { business } = await requireBusiness();
  const data = await loadGuideData({ id: business.id });

  if (!data) {
    return (
      <>
        <PageHeading title="Sådan virker det" />
        <p className="font-[200] text-[0.95rem] text-stone">
          Opret dit kort først, så bygger vi guiden til dit personale.
        </p>
      </>
    );
  }

  const publicUrl = `${APP_URL}/guide/${data.slug}`;

  return (
    <>
      <PageHeading
        title="Sådan virker det"
        subtitle="Guiden til dit personale. Den opdaterer sig selv efter dine indstillinger."
        action={<PrintGuideButton />}
      />

      <div className="mb-10 rounded-lg border border-fog bg-white p-5 print:hidden">
        <p className="text-[0.9rem] font-[400] text-ink">
          Del med personalet uden login
        </p>
        <p className="mt-1 mb-3 text-[0.82rem] font-[200] leading-relaxed text-stone">
          Send dette link, eller lav en QR til bagvæggen. Det viser guiden uden
          adgang til dit dashboard.
        </p>
        <CopyInline
          value={publicUrl}
          display={publicUrl.replace(/^https?:\/\//, "")}
        />
      </div>

      <GuideContent data={data} />
    </>
  );
}
