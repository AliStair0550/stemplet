import "server-only";
import { createHash } from "node:crypto";
import type { Business } from "@prisma/client";
import { prisma } from "./prisma";
import { getBusinessCards } from "./cards";
import { optimizedLogoDataUri } from "./logo";
import type { StampIconKey } from "./brand";
import { cardTitle } from "./brand";
import { effectiveStyle, normalizeActions, type CardLookContext } from "./card-look";
import { rewardPhrase } from "./referral-text";
import { isCardArt } from "./card-art";
import type { WalletCardPreviewProps } from "@/components/WalletCardPreview";

type PreviewBusiness = Omit<Business, "logoUrl" | "cardArtwork" | "cardArt" | "posterPhoto">;

/**
 * Alt, der skal til for at vise butikkens kort som i kundernes Wallet (Hjem og
 * butikssiden): butikkens design, Stemplets regler og Henvisningers beloenninger.
 * Billederne sendes ikke i fuld stoerrelse med til telefonen: kortbilledet er en
 * cachet adresse med version (kun naar stilen viser det), og logoet en lille webp.
 */
export async function loadCardPreview(business: PreviewBusiness): Promise<Omit<WalletCardPreviewProps, "os">> {
  const [card, rule, images] = await Promise.all([
    getBusinessCards(business.id).then((cards) => cards[0] ?? null),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
    prisma.business.findUnique({
      where: { id: business.id },
      select: { logoUrl: true, cardArtwork: true, cardArt: true },
    }),
  ]);
  const artwork = images?.cardArtwork ?? null;
  const ctx: CardLookContext = {
    stampsEnabled: business.stampsEnabled,
    referralsEnabled: business.referralsEnabled,
    bookingUrl: business.bookingUrl,
  };
  const style = effectiveStyle(business.cardStyle, ctx, !!artwork);
  return {
    style,
    artwork:
      style === "photo" && artwork
        ? `/k/${business.slug}/kortbillede?v=${createHash("sha1").update(artwork).digest("hex").slice(0, 10)}`
        : null,
    art: isCardArt(images?.cardArt) ? images.cardArt : "aurora",
    accent: business.cardAccent,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: await optimizedLogoDataUri(images?.logoUrl ?? null, 256),
    header: business.cardHeader,
    name: cardTitle(business),
    stampIcon: (card?.stampIcon as StampIconKey) ?? "coffee",
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "Din belønning",
    product: business.stampsEnabled && business.referralsEnabled ? "begge" : business.referralsEnabled ? "henvisninger" : "stemplet",
    friendReward: rule ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : "100 kr.",
    referrerReward: rule ? rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue) : "gratis klip",
    actions: normalizeActions(business.cardActions, ctx),
  };
}
