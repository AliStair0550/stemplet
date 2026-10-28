import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { APP_URL } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";
import { cardCookieName, DEVICE_ID_COOKIE } from "@/lib/cookies";
import { findVisitorCard, findReferrerByCode } from "@/lib/referral-signup";
import { assignReferralCode } from "@/lib/referral";
import { firstName, referralShareUrl, rewardPhrase } from "@/lib/referral-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Butikssidens personlige del (/k/[slug] er statisk og cachet, saa den aabner
// lynhurtigt; det personlige hentes her bagefter i eet opslag): er den
// besoegende kendt, kundens egen kode, link og beloenninger, og vennen bag ?k.

export type ShopStatus = {
  known: boolean;
  me: { code: string; shareUrl: string; referred: boolean; rewards: string[] } | null;
  friend: { firstName: string | null } | null;
  invalidCode: boolean;
  /** Kundens eget link aabnet paa egen telefon. */
  own: boolean;
};

const json = (s: ShopStatus) => NextResponse.json(s, { headers: { "cache-control": "no-store" } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = req.nextUrl.searchParams.get("k")?.trim().slice(0, 40) || null;
  const none: ShopStatus = { known: false, me: null, friend: null, invalidCode: false, own: false };

  const shop = await withDbRetry(() =>
    prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        referralsEnabled: true,
        referralRule: { select: { id: true } },
        cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1, select: { id: true } },
      },
    }),
  ).catch(() => null);
  if (!shop || shop.cards.length === 0) return json(none);

  const jar = await cookies();
  const [visitor, referrer] = await Promise.all([
    findVisitorCard(shop.cards[0]!.id, jar.get(cardCookieName(shop.id))?.value, jar.get(DEVICE_ID_COOKIE)?.value),
    k && shop.referralsEnabled ? findReferrerByCode(shop.id, k) : null,
  ]);
  const referrals = shop.referralsEnabled && !!shop.referralRule;
  const own = !!visitor && !!referrer && referrer.id === visitor.id;

  let me: ShopStatus["me"] = null;
  if (visitor && referrals) {
    // Kort fra foer henvisningerne (eller uden navn) faar en kode nu, saa
    // "Henvis en ven" altid virker for en kendt kunde.
    const code = visitor.referralCode ?? (await assignReferralCode({ customerCardId: visitor.id, name: visitor.name }));
    const rewards = await prisma.reward.findMany({
      where: { cardId: visitor.id, status: "AVAILABLE", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "asc" },
      select: { type: true, value: true },
    });
    me = {
      code,
      shareUrl: referralShareUrl(APP_URL, slug, code),
      referred: visitor.referredByCardId !== null,
      rewards: rewards.map((r) => rewardPhrase(r.type, r.value)),
    };
  }

  return json({
    known: !!visitor,
    me,
    friend: referrer && !own ? { firstName: firstName(referrer.name) } : null,
    invalidCode: !!k && referrals && !referrer,
    own,
  });
}
