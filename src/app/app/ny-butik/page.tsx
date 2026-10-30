import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { isSuperadminEmail } from "@/lib/superadmin-emails";
import { PageHeading } from "@/components/dash";
import { NewBusinessForm } from "./NewBusinessForm";

export const metadata: Metadata = { title: "Ny butik" };
export const dynamic = "force-dynamic";

export default async function NyButikPage() {
  // Kraev login (agentur-flow: opret en butik under din egen konto).
  const { email } = await requireBusiness();
  // Kun superadmin opretter flere butikker; en butiksejer sendes til Hjem.
  if (!isSuperadminEmail(email)) redirect("/app");
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
