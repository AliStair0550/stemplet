import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { cn } from "@/lib/utils";
import { cardTitle, type StampIconKey } from "@/lib/brand";
import type { CardDesign } from "@/components/CardDesigner";
import { KortEditor } from "../kort/KortEditor";
import { RuleForm } from "../henvisninger/RuleForm";
import { FeatureSwitch } from "./FeatureSwitch";
import { KundekortShare } from "./KundekortShare";
import { CardNameForm } from "./CardNameForm";
import { autoCardName, cardShortName, claimCta } from "@/lib/card-name";
import { rewardPhrase } from "@/lib/referral-text";
import type { Feature } from "./actions";

export const metadata: Metadata = { title: "Regler for dit kort" };
export const dynamic = "force-dynamic";

// Regler: hvad kortet kan, samlet eet sted. Oeverst slaas funktionerne til og
// fra; derunder reglerne for den valgte funktion. Udseendet ligger under Design.

const FEATURES: Record<Feature, { title: string; text: string; offWarning: string; icon: React.ReactNode }> = {
  stempler: {
    title: "Stempler",
    text: "Stempelkortet, der skaber flere gensyn.",
    offWarning:
      "Slå stempler fra? Kunderne kan ikke få nye stempler, og stemplerne forsvinder fra kortet. Intet slettes: slår du det til igen, er stemplerne der stadig.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.5 12.2 2.4 2.4 4.6-5" />
      </>
    ),
  },
  henvisninger: {
    title: "Henvisninger",
    text: "Motivér dine kunder til at henvise dig.",
    offWarning:
      "Slå henvisninger fra? Koderne forsvinder fra kortet, og henvisningssiden lukker. Intet slettes: slår du det til igen, er koder og belønninger der stadig.",
    icon: (
      <>
        <circle cx="8" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M2.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5M14.5 15.2c.8-.5 1.6-.7 2.5-.7 2.2 0 3.8 1.3 4.5 3.8" />
      </>
    ),
  },
};

export default async function ReglerPage({ searchParams }: { searchParams: Promise<{ f?: string; vis?: string }> }) {
  const { business } = await requireBusiness();
  const { f, vis } = await searchParams;

  const enabled: Record<Feature, boolean> = {
    stempler: business.stampsEnabled,
    henvisninger: business.referralsEnabled,
  };
  const features = (Object.keys(FEATURES) as Feature[]).filter((k) => enabled[k]);
  // Fanerne: de aktive funktioner og Kundekort (QR og link til deling).
  type Tab = Feature | "kundekort";
  const tabs: Tab[] = [...features, "kundekort"];
  const active: Tab | null =
    f === "kundekort"
      ? "kundekort"
      : f === "stempler" || f === "henvisninger"
        ? enabled[f]
          ? f
          : null
        : (tabs[0] ?? null);
  const onlyOne = features.length === 1;
  const tabTitle = (k: Tab) => (k === "kundekort" ? "Kundekort" : FEATURES[k].title);

  return (
    <>
      <PageHeading
        title="Regler"
        subtitle="Vælg hvad dit kort kan, og hvordan det virker."
      />

      <section className="mb-10">
        <h2 className="mb-3 text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Funktioner på kortet</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {(Object.keys(FEATURES) as Feature[]).map((k) => (
            <FeatureSwitch
              key={k}
              feature={k}
              title={FEATURES[k].title}
              text={FEATURES[k].text}
              offWarning={FEATURES[k].offWarning}
              icon={FEATURES[k].icon}
              on={enabled[k]}
              locked={onlyOne}
            />
          ))}
        </div>
      </section>

      {active ? (
        <section>
          {tabs.length > 1 ? (
            <div className="mb-6 flex w-fit rounded-full bg-[#F2F5F9] p-1">
              {tabs.map((k) => (
                <Link
                  key={k}
                  href={`/app/regler?f=${k}`}
                  scroll={false}
                  aria-current={active === k ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-[0.88rem]",
                    active === k ? "bg-ink font-semibold text-white" : "text-stone hover:text-ink",
                  )}
                >
                  {tabTitle(k)}
                </Link>
              ))}
            </div>
          ) : (
            <h2 className="mb-4 text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">{tabTitle(active)}</h2>
          )}
          {active === "stempler" ? <StampRules business={business} /> : null}
          {active === "henvisninger" ? <ReferralRules business={business} /> : null}
          {active === "kundekort" ? <CardShare business={business} show={vis === "1"} /> : null}
        </section>
      ) : null}
    </>
  );
}

type Biz = Awaited<ReturnType<typeof requireBusiness>>["business"];

async function StampRules({ business }: { business: Biz }) {
  const card = await prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } });
  const initial: CardDesign = {
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "10. kop er gratis",
    stampIcon: (card?.stampIcon as StampIconKey) ?? "coffee",
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
    logoScale: business.logoScale,
    terms: card?.terms ?? null,
    displayName: business.displayName,
  };
  const qrDataUrl = await QRCode.toDataURL(`${APP_URL}/k/${business.slug}`, {
    margin: 1,
    width: 320,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
  return <KortEditor initial={initial} businessName={business.name} slug={business.slug} qrDataUrl={qrDataUrl} />;
}

async function CardShare({ business, show }: { business: Biz; show: boolean }) {
  const url = `${APP_URL}/k/${business.slug}`;
  const [qrDataUrl, card, rule] = await Promise.all([
    QRCode.toDataURL(url, { margin: 2, width: 900, color: { dark: "#0B1628", light: "#FFFFFF" } }),
    prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" }, select: { rewardText: true, stampsRequired: true } }),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
  ]);
  // Det, kunden faar: stempelbeloenningen og vennens rabat (det, butikken har slaaet til).
  const lines = [
    ...(business.stampsEnabled && card ? [`${card.rewardText} efter ${card.stampsRequired} stempler`] : []),
    ...(rule ? [`Henvis en ven: ${rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue)}`] : []),
  ];
  return (
    <div className="flex flex-col gap-6">
      <KundekortShare
        url={url}
        qrDataUrl={qrDataUrl}
        autoOpen={show}
        walletPassUrl={WALLET_ENABLED ? "/api/wallet/butikkort" : null}
        showcase={{
          shopName: cardTitle(business),
          logoUrl: business.logoUrl,
          headline: claimCta(cardShortName(business)),
          lines,
          primaryColor: business.primaryColor,
          textColor: business.textColor,
        }}
      />
      <CardNameForm
        initialName={business.cardName ?? ""}
        autoName={autoCardName(cardTitle(business))}
        primaryColor={business.primaryColor}
        textColor={business.textColor}
      />
    </div>
  );
}

async function ReferralRules({ business }: { business: Biz }) {
  const rule = await prisma.referralRule.findUnique({ where: { businessId: business.id } });
  return (
    <RuleForm
      pageUrl={`${APP_URL}/k/${business.slug}`}
      isNew={!rule}
      afterCreate="/app/regler?f=henvisninger"
      initial={{
        newCustomerRewardType: rule?.newCustomerRewardType ?? "AMOUNT",
        newCustomerRewardValue: rule?.newCustomerRewardValue ?? "100",
        referrerRewardType: rule?.referrerRewardType ?? "AMOUNT",
        referrerRewardValue: rule?.referrerRewardValue ?? "100",
        minPurchaseKr: rule?.minPurchaseKr?.toString() ?? "",
        maxReferralsPerMonth: rule ? (rule.maxReferralsPerMonth?.toString() ?? "") : "",
        rewardExpiryDays: (rule?.rewardExpiryDays ?? 180).toString(),
        termsLine: rule?.termsLine ?? "",
        bookingUrl: business.bookingUrl ?? "",
      }}
    />
  );
}
