import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { Scribble } from "@/components/henvisninger-site/Hand";
import { getReferralWorklist } from "@/lib/referral-desk";
import { ReferralWorklist } from "./ReferralWorklist";
import { ShopLinkCard } from "./ShopLinkCard";
import { AddToHomeButton } from "../AddToHomeButton";
import { APP_URL } from "@/lib/env";

export const metadata: Metadata = { title: "Henvisninger" };
export const dynamic = "force-dynamic";

// Henvisningers Overblik: en kasse, personalet arbejder fra (find kunden, giv
// rabat, indloes). Tal og bedste ambassadoerer ligger under Statistik,
// opsaetningen under Regler. Kun for
// butikker med modulet; ellers en aegte 404.

function ReferralHeader() {
  return (
    <header className="mb-10">
      <h1 className="relative inline-block pb-[0.9rem] text-ink">
        <HenvisningerLogo className="-ml-1 h-[2.9rem]" />
        <Scribble className="absolute bottom-0 left-[14%] h-[1rem] w-[90%]" />
      </h1>
      <p className="mt-3 text-[1rem] text-stone">
        Din henvisningskasse. Find kunden, giv rabatten, og indløs belønninger.
      </p>
    </header>
  );
}

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) redirect("/app/henvisninger/tilfoej");

  const rule = await prisma.referralRule.findUnique({
    where: { businessId: business.id },
    select: { id: true },
  });
  if (!rule) {
    return (
      <>
        <ReferralHeader />
        <Panel>
          <p className="text-[1.05rem] text-ink">Sæt dine belønninger op for at komme i gang.</p>
          <p className="mt-1 text-[0.88rem] text-stone">
            Bestem hvad den nye kunde og ambassadøren får. Indtil da er henvisningssiden lukket.
          </p>
          <Link href="/app/henvisninger/indstillinger" className={`${btnClass("primary")} mt-5`}>
            Sæt belønninger op
          </Link>
        </Panel>
      </>
    );
  }

  const q = ((await searchParams).q ?? "").slice(0, 60);
  const { waiting, owed } = await getReferralWorklist(business.id, q);

  return (
    <>
      <ReferralHeader />
      <ReferralWorklist waiting={waiting} owed={owed} hasPin={business.staffPin != null} initialQuery={q} />
      <h2 className="mb-3 mt-12 text-[1.2rem] font-[700] tracking-[-0.02em] text-ink">Del din henvisningsside</h2>
      <ShopLinkCard url={`${APP_URL}/henvisninger/${business.slug}`} />
      <div className="mb-8">
        <AddToHomeButton
          title="Tilføj Henvisninger til hjemmeskærmen"
          text="Så åbner du listen med ét tryk, når der kommer kunder."
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/henvisninger-icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px]" />
          }
        />
      </div>
    </>
  );
}
