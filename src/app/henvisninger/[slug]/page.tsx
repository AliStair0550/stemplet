import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { cardTitle, contrastRatio, contrastText } from "@/lib/brand";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { cardCookieName, DEVICE_ID_COOKIE } from "@/lib/cookies";
import { optimizedLogoDataUri } from "@/lib/logo";
import {
  loadReferralShop,
  findReferrerByCode,
  findVisitorCard,
} from "@/lib/referral-signup";
import { firstName, rewardPhrase } from "@/lib/referral-text";
import { ReferralFlow } from "./ReferralFlow";

// Henvisningssiden (docs/henvisninger.md, Flows + Visuel stil). Tilstanden styres
// af URL'en: uden ?k er det "Henvis en ven", med ?k er det vennens gave. Har
// kunden allerede en kode hos butikken, vises den direkte. Dynamisk (cookies og
// ?k), og kun for butikker med henvisninger slaaet til; ellers en aegte 404.
export const dynamic = "force-dynamic";

// Henvisningers egen base (dokumentets palette). Butikkens farve ligger ovenpaa
// som accent; er den for lys til hvid baggrund, bruges terrakotta.
const ACCENT_FALLBACK = "#B5543B";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await loadReferralShop(slug);
  const title = shop ? `Henvis en ven til ${cardTitle(shop)}` : "Henvisninger";
  return {
    title,
    description: shop
      ? `Del din kode, og giv dine venner ${rewardPhrase(shop.rule.newCustomerRewardType, shop.rule.newCustomerRewardValue)} hos ${cardTitle(shop)}.`
      : undefined,
    // Personlig side: ikke i soegemaskiner, men link-previews virker stadig.
    robots: { index: false },
  };
}

export default async function ReferralPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; via?: string }>;
}) {
  const { slug } = await params;
  const { k, via } = await searchParams;
  const shop = await loadReferralShop(slug);
  if (!shop) notFound();

  const jar = await cookies();
  const visitor = await findVisitorCard(
    shop.activeCardId,
    jar.get(cardCookieName(shop.id))?.value,
    jar.get(DEVICE_ID_COOKIE)?.value,
  );
  const referrer = k ? await findReferrerByCode(shop.id, k) : null;
  // Eget link paa egen telefon: vis bare kundens egen side.
  const ownLink = referrer !== null && referrer.id === visitor?.id;

  const shopName = cardTitle(shop);
  const rule = shop.rule;
  const accent =
    contrastRatio(shop.primaryColor, "#FFFFFF") >= 3 ? shop.primaryColor : ACCENT_FALLBACK;
  const logoSrc = await optimizedLogoDataUri(shop.logoUrl);
  const bookingUrl =
    shop.bookingUrl && /^https?:\/\//i.test(shop.bookingUrl) ? shop.bookingUrl : null;

  return (
    <main
      className="flex min-h-[100svh] flex-col items-center bg-white px-6 py-10 text-[#1D1D1F]"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif',
      }}
    >
      <ReferralFlow
        slug={slug}
        appUrl={APP_URL}
        shopName={shopName}
        logoSrc={logoSrc}
        accent={accent}
        accentFg={contrastText(accent)}
        newCustomerReward={rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue)}
        referrerReward={rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue)}
        termsLine={rule.termsLine}
        bookingUrl={bookingUrl}
        walletEnabled={WALLET_ENABLED}
        referrer={
          referrer && !ownLink
            ? { code: referrer.referralCode!, firstName: firstName(referrer.name) }
            : null
        }
        source={via === "kode" ? "CODE_ENTERED" : "LINK"}
        invalidCode={Boolean(k) && referrer === null}
        initial={
          visitor?.referralCode
            ? {
                code: visitor.referralCode,
                referred: visitor.referredByCardId !== null,
                // Kom via en vens kode, men har allerede et kort: ingen rabat.
                alreadyCustomer:
                  referrer !== null && !ownLink && visitor.referredByCardId === null,
              }
            : null
        }
      />
    </main>
  );
}
