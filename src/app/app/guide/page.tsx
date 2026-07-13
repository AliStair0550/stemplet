import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { loadGuideData } from "@/lib/guide";
import { PageHeading } from "@/components/dash";
import { GuideContent } from "@/components/guide/GuideContent";
import { GuideActions } from "@/components/guide/GuideActions";
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
        action={<GuideActions publicUrl={publicUrl} />}
      />

      <GuideContent data={data} />
    </>
  );
}
