import "server-only";
import { prisma } from "./prisma";
import { getBusinessCards } from "./cards";
import { rewardPhrase } from "./referral-text";

// Belønningshistorik til Hjem ("Givet for nylig"): fulde stempelkort, der er
// indløst, henvisningsbelønninger, der er givet, og vennens rabat ved første
// besøg. Samlet og sorteret efter tid, nyeste først.

export type RewardEvent = {
  id: string;
  at: Date;
  name: string | null;
  serial: string;
  kind: "stamps" | "reward" | "visit";
  /** Det, kunden fik, fx "gratis kaffe" eller "100 kr.". */
  what: string;
};

export async function getRewardHistory(
  b: { id: string; stampsEnabled: boolean; referralsEnabled: boolean },
  take = 8,
): Promise<RewardEvent[]> {
  const card = { select: { name: true, serial: true } } as const;
  const [redemptions, rewards, stampCard] = await Promise.all([
    b.stampsEnabled
      ? prisma.redemption.findMany({
          where: { customerCard: { card: { businessId: b.id } } },
          orderBy: { createdAt: "desc" },
          take,
          select: { id: true, createdAt: true, customerCard: card },
        })
      : [],
    prisma.reward.findMany({
      where: { businessId: b.id, status: "REDEEMED", redeemedAt: { not: null } },
      orderBy: { redeemedAt: "desc" },
      take,
      select: { id: true, redeemedAt: true, type: true, value: true, cardId: true, referral: { select: { referredCardId: true } }, card },
    }),
    getBusinessCards(b.id).then((cards) => cards[0] ?? null),
  ]);

  const stampWhat = stampCard?.rewardText?.trim() || "fuldt stempelkort";
  const events: RewardEvent[] = [
    ...redemptions.map((r) => ({ id: `s-${r.id}`, at: r.createdAt, ...r.customerCard, kind: "stamps" as const, what: stampWhat })),
    // Vennens rabat ved foerste besoeg er ogsaa en Reward (indloest med det samme).
    ...rewards.map((r) => ({
      id: `r-${r.id}`,
      at: r.redeemedAt!,
      ...r.card,
      kind: r.referral?.referredCardId === r.cardId ? ("visit" as const) : ("reward" as const),
      what: rewardPhrase(r.type, r.value),
    })),
  ];
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}
