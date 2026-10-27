import type { PassField, ReferralPassInfo } from "./referral-fields";
import { referralFrontFields } from "./referral-fields";
import type { CardAction } from "../card-look";

// iOS 27-plakatkortet ("posterGeneric") oven paa det klassiske kort: Wallet
// viser plakaten paa iOS 27 og falder tilbage til storeCard paa aeldre iPhones.
// Ren logik (felter og knapper), saa den kan enhedstestes uden certifikater.
// Slaas til med WALLET_POSTER=true, foerst naar det er set paa en rigtig iPhone.

export function posterEnabled(): boolean {
  return process.env.WALLET_POSTER === "true";
}

export type PosterContent = {
  stamps: number;
  required: number;
  rewardText: string;
  /** Stemplet slaaet til for butikken. */
  stampsEnabled: boolean;
  referral: ReferralPassInfo | null;
};

export type PosterFields = { header: PassField[]; primary: PassField[]; footer: PassField[] };

/**
 * Plakatens felter: eet felt oeverst, hovedfelter og en bundlinje. Indholdet
 * foelger produkterne (kun Stemplet, begge, kun Henvisninger).
 */
export function posterFields(c: PosterContent): PosterFields {
  const stampsField: PassField = {
    key: "stamps",
    label: "STEMPLER",
    value: `${Math.min(c.stamps, c.required)}/${c.required}`,
  };
  const left = Math.max(0, c.required - c.stamps);
  const progress = left === 0 ? "Kortet er fuldt. Vis det ved kassen." : `${left} ${left === 1 ? "stempel" : "stempler"} til næste belønning`;

  if (c.referral && !c.stampsEnabled) {
    const [code, owed] = referralFrontFields(c.referral);
    return {
      header: [{ ...owed!, textAlignment: undefined }],
      primary: [{ key: code!.key, label: code!.label, value: code!.value }],
      footer: [{ key: "footer", label: "", value: `Din ven får ${c.referral.newCustomerReward} ved første besøg` }],
    };
  }
  if (c.referral) {
    const [code, owed] = referralFrontFields(c.referral);
    return {
      header: [stampsField],
      primary: [
        { key: code!.key, label: code!.label, value: code!.value },
        { ...owed!, textAlignment: undefined },
      ],
      footer: [{ key: "footer", label: "", value: `Belønning: ${c.rewardText}` }],
    };
  }
  return {
    header: [stampsField],
    primary: [{ key: "reward", label: "BELØNNING", value: c.rewardText }],
    footer: [{ key: "footer", label: "", value: progress }],
  };
}

export type FeaturedActionInput = {
  actions: CardAction[];
  bookingUrl: string | null;
  /** Kundens egen henvisningsside (henvis en ven / se belønninger). */
  referralPageUrl: string | null;
  /** Kundens stempelkort-side (se belønninger uden Henvisninger). */
  cardPageUrl: string;
};

export type FeaturedAction = {
  identifier: string;
  type: "bookAppointment" | "viewOffersRewards" | "membershipBenefits";
  url: string;
};

/** Butikkens valgte knapper som Apples "Featured Actions" (hoejst to). */
export function featuredActionsFor(i: FeaturedActionInput): FeaturedAction[] {
  const out: FeaturedAction[] = [];
  for (const a of i.actions) {
    if (a === "book" && i.bookingUrl && /^https?:\/\//i.test(i.bookingUrl)) {
      out.push({ identifier: "book", type: "bookAppointment", url: i.bookingUrl });
    } else if (a === "henvis" && i.referralPageUrl) {
      out.push({ identifier: "henvis", type: "viewOffersRewards", url: i.referralPageUrl });
    } else if (a === "beloenninger") {
      out.push({ identifier: "beloenninger", type: "membershipBenefits", url: i.referralPageUrl ?? i.cardPageUrl });
    }
    if (out.length === 2) break;
  }
  return out;
}
