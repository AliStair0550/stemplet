import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { PageHeading } from "@/components/dash";
import { KommunikationTabs } from "../beskeder/KommunikationTabs";

export const metadata: Metadata = { title: "Nyhedsmail" };

export default async function NyhedsmailPage() {
  await requireBusiness();
  return (
    <>
      <KommunikationTabs active="nyhedsmail" />
      <PageHeading title="Nyhedsmail" subtitle="Nyhedsmail er under udarbejdelse." />
    </>
  );
}
