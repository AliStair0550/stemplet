import { WALLET_ENABLED, APP_URL } from "@/lib/env";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cardTitle } from "@/lib/brand";
import { rewardPhrase } from "@/lib/referral-text";
import { buildShopQrPass } from "@/lib/wallet/pass";
import { captureWalletError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Butikkens QR-kort til ejerens egen Wallet (Hjem og Regler > Kundekort): den
// hurtigste maade at vise kunderne koden paa fra telefonen.
export async function GET() {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { business } = await requireBusiness();
  const [card, rule] = await Promise.all([
    prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" }, select: { rewardText: true, stampsRequired: true, stampIcon: true } }),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
  ]);
  const lines = [
    ...(business.stampsEnabled && card ? [`${card.rewardText} efter ${card.stampsRequired} stempler`] : []),
    ...(rule ? [`Henvis en ven: ${rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue)}`] : []),
  ];
  try {
    const buf = await buildShopQrPass({
      businessId: business.id,
      businessName: cardTitle(business),
      pageUrl: `${APP_URL}/k/${business.slug}`,
      primaryColor: business.primaryColor,
      textColor: business.textColor,
      logoUrl: business.logoUrl,
      stampIcon: card?.stampIcon ?? "coffee",
      lines,
    });
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": "application/vnd.apple.pkpass",
        // inline: iOS Safari aabner passet direkte i Wallet.
        "content-disposition": `inline; filename="${business.slug}-qr.pkpass"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    captureWalletError(e, { operation: "buildShopQrPass", businessId: business.id });
    return new Response("Kortet kunne ikke laves lige nu. Prøv igen om lidt.", { status: 500 });
  }
}
