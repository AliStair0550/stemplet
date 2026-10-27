import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { APP_URL } from "@/lib/env";
import { RuleForm } from "../RuleForm";

export const metadata: Metadata = { title: "Indstillinger for henvisninger" };
export const dynamic = "force-dynamic";

// Opsaetning af henvisninger: beloenninger, betingelser, graenser og booking.
// Egen side, saa fanen Henvisninger forbliver enkel.
export default async function ReferralSettingsPage() {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) redirect("/app/henvisninger/tilfoej");
  const rule = await prisma.referralRule.findUnique({ where: { businessId: business.id } });

  return (
    <>
      <Link
        href="/app/henvisninger"
        className="mb-4 inline-block text-[0.8rem] text-stone hover:text-ink"
      >
        ← Henvisninger
      </Link>
      <PageHeading
        title="Indstillinger"
        subtitle="Bestem hvad dine kunder får, når de anbefaler dig."
      />
      <RuleForm
        pageUrl={`${APP_URL}/henvisninger/${business.slug}`}
        isNew={!rule}
        initial={{
          newCustomerRewardType: rule?.newCustomerRewardType ?? "AMOUNT",
          newCustomerRewardValue: rule?.newCustomerRewardValue ?? "100",
          referrerRewardType: rule?.referrerRewardType ?? "AMOUNT",
          referrerRewardValue: rule?.referrerRewardValue ?? "100",
          minPurchaseKr: rule?.minPurchaseKr?.toString() ?? "",
          // Ingen betingelser som standard (Alis valg): intet loft, intet
          // minimumskoeb og ingen betingelseslinje. Kan saettes her.
          maxReferralsPerMonth: rule ? (rule.maxReferralsPerMonth?.toString() ?? "") : "",
          rewardExpiryDays: (rule?.rewardExpiryDays ?? 180).toString(),
          termsLine: rule?.termsLine ?? "",
          bookingUrl: business.bookingUrl ?? "",
        }}
      />
    </>
  );
}
