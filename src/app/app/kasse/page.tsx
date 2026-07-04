import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { PageHeading } from "@/components/dash";
import { Kassemodus } from "./Kassemodus";

export const metadata: Metadata = { title: "Kasse" };
export const dynamic = "force-dynamic";

export default async function KassePage() {
  await requireBusiness();
  return (
    <>
      <PageHeading
        title="Kasse"
        subtitle="Vis stempel-QR til kunden, eller scan kundens kort."
      />
      <Kassemodus />
    </>
  );
}
