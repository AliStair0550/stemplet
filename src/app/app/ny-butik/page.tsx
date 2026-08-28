import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { PageHeading } from "@/components/dash";
import { NewBusinessForm } from "./NewBusinessForm";

export const metadata: Metadata = { title: "Ny butik" };
export const dynamic = "force-dynamic";

export default async function NyButikPage() {
  // Kraev login (agentur-flow: opret en butik under din egen konto).
  await requireBusiness();
  return (
    <>
      <PageHeading
        title="Opret ny butik"
        subtitle="Byg hele kundens opsætning under din egen konto, og præsentér den. Når de er med, tilføjer du deres login-mail under Indstillinger."
      />
      <NewBusinessForm />
    </>
  );
}
