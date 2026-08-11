import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { PageHeading } from "@/components/dash";
import { GettingStarted } from "../GettingStarted";

export const metadata: Metadata = { title: "Kom i gang" };
export const dynamic = "force-dynamic";

export default async function KomIGangPage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageHeading
        title="Kom i gang"
        subtitle="Sådan får du kunderne i gang og giver det første stempel. Kig altid forbi her, hvis du er i tvivl om, hvordan noget virker."
      />
      <GettingStarted slug={business.slug} />
    </>
  );
}
