import { WALLET_ENABLED, APP_URL } from "@/lib/env";
import { requireBusinessWithImages } from "@/lib/session";
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
  const { business } = await requireBusinessWithImages();
  const [card, rule] = await Promise.all([
    prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" }, select: { rewardText: true, stampsRequired: true, stampIcon: true } }),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
  ]);
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const fields = [
    ...(business.stampsEnabled && card ? [{ label: `EFTER ${card.stampsRequired} STEMPLER`, value: cap(card.rewardText) }] : []),
    ...(rule ? [{ label: "HENVIS EN VEN", value: cap(rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue)) }] : []),
  ];
  // QR-koden i Wallet er til at vise kunderne: Kom i gang krydser "del" af.
  if (!business.sharedAt) {
    await prisma.business.updateMany({ where: { id: business.id, sharedAt: null }, data: { sharedAt: new Date() } }).catch(() => {});
  }
  try {
    const buf = await buildShopQrPass({
      businessId: business.id,
      businessName: cardTitle(business),
      pageUrl: `${APP_URL}/k/${business.slug}`,
      primaryColor: business.primaryColor,
      textColor: business.textColor,
      logoUrl: business.logoUrl,
      stampIcon: card?.stampIcon ?? "coffee",
      fields,
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
