import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { IntegrationsClient } from "./IntegrationsClient";

export const metadata: Metadata = { title: "Integrationer" };
export const dynamic = "force-dynamic";

export default async function IntegrationerPage() {
  const { business } = await requireBusiness();

  return (
    <>
      <PageHeading
        title="Integrationer"
        subtitle="Forbind Stemplet til dit kassesystem, din webshop eller Zapier, så det kører af sig selv."
      />
      <IntegrationsClient
        apiKey={business.apiKey}
        webhookUrl={business.webhookUrl}
        baseUrl={APP_URL}
      />
    </>
  );
}
