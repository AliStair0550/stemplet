import type { RewardType } from "@prisma/client";
import { rewardPhrase } from "../referral-text";

// Henvisningernes felter paa Wallet-kortet (fase 4). Ren logik uden certifikater,
// database eller netvaerk, saa den kan enhedstestes. pass.ts bruger dem KUN, naar
// kortet har henvisningsoplysninger; et rent stempelkort bygges praecis som foer.

export type ReferralPassInfo = {
  code: string;
  shareUrl: string;
  pageUrl: string;
  termsLine: string | null;
  /** Fra butikkens regel, fx "100 kr." og "gratis klip". */
  newCustomerReward: string;
  referrerReward: string;
  referralsDone: number;
  /** Beloenninger der kan indloeses nu (ikke udloebne). */
  rewards: { type: RewardType; value: string }[];
  /** Sidste aendring var en ny beloenning (ikke en indloesning): vis en besked. */
  announce: boolean;
};

export type PassField = {
  key: string;
  label: string;
  value: string;
  textAlignment?: "PKTextAlignmentLeft" | "PKTextAlignmentCenter" | "PKTextAlignmentRight";
  changeMessage?: string;
};

const NOTHING_YET = "Intet endnu";

/** "100 kr." (beloeb lagt sammen), "Gratis klip", "3 stempler" eller "2 belønninger". */
export function owedLabel(rewards: ReferralPassInfo["rewards"]): string {
  if (rewards.length === 0) return NOTHING_YET;
  if (rewards.every((r) => r.type === "AMOUNT")) {
    const sum = rewards.reduce((s, r) => s + (Number.parseInt(r.value, 10) || 0), 0);
    return rewardPhrase("AMOUNT", String(sum));
  }
  if (rewards.length === 1) {
    const p = rewardPhrase(rewards[0]!.type, rewards[0]!.value);
    return p.charAt(0).toUpperCase() + p.slice(1);
  }
  return `${rewards.length} belønninger`;
}

/**
 * Forsiden, under stempelgitteret og ved siden af Stemplets "BELØNNING": kundens
 * kode og hvad hun har til gode. "Til gode" staar der altid, saa iPhone kan
 * vise en besked, naar vaerdien stiger (en besked kraever et felt, der skifter
 * vaerdi). Beskeden saettes kun ved en ny beloenning, aldrig ved en indloesning.
 */
// Notifikationer kommer kun fra butikkens egne pushbeskeder (Ali 2026-10-30).
// Kortet opdateres stadig tavst; saet til true for at faa "til gode"-beskeden tilbage.
const REFERRAL_PUSH_MESSAGES = false;

export function referralFrontFields(info: ReferralPassInfo): PassField[] {
  const owed: PassField = {
    key: "ref-owed",
    label: "TIL GODE",
    value: owedLabel(info.rewards),
    textAlignment: "PKTextAlignmentRight",
  };
  if (REFERRAL_PUSH_MESSAGES && info.announce && info.rewards.length > 0) {
    owed.changeMessage =
      info.referralsDone > 0
        ? "Din ven har været her. Du har nu %@ til gode."
        : "Du har nu %@ til gode.";
  }
  return [
    // "Henvis en ven" fortaeller, hvad koden er til (Alis test: "Din kode" var uklart).
    { key: "ref-code", label: "HENVIS EN VEN", value: info.code, textAlignment: "PKTextAlignmentCenter" },
    owed,
  ];
}

/** Bagsiden: deling, belønninger, antal venner, betingelser og kundesiden. */
export function referralBackFields(info: ReferralPassInfo): PassField[] {
  const n = info.referralsDone;
  const fields: PassField[] = [
    {
      key: "ref-how",
      label: "Sådan henviser du en ven",
      value: `Giv din ven koden ${info.code}, eller send linket herunder. Din ven får ${info.newCustomerReward} ved første besøg, og du får ${info.referrerReward}, når vennen har været her.`,
    },
    {
      key: "ref-share",
      label: "Dit link",
      value: info.shareUrl,
    },
    {
      key: "ref-rewards",
      label: "Dine belønninger",
      value:
        info.rewards.length === 0
          ? "Ingen endnu. Del din kode med en ven."
          : info.rewards
              .map((r) => {
                const p = rewardPhrase(r.type, r.value);
                return p.charAt(0).toUpperCase() + p.slice(1);
              })
              .join("\n"),
    },
    {
      key: "ref-count",
      label: "Henvisninger",
      value: n === 0 ? "Du har ikke henvist nogen endnu." : `Du har henvist ${n} ${n === 1 ? "ven" : "venner"}.`,
    },
  ];
  if (info.termsLine) {
    fields.push({ key: "ref-terms", label: "Betingelser for henvisninger", value: info.termsLine });
  }
  fields.push({ key: "ref-page", label: "Din side", value: info.pageUrl });
  return fields;
}

/**
 * Forsiden for en butik uden Stemplet (kun Henvisninger): koden stort som
 * primaerfelt, og nedenunder hvad vennen faar og hvad kunden har til gode.
 */
export function referralOnlyFrontFields(info: ReferralPassInfo): { primary: PassField[]; secondary: PassField[] } {
  const [code, owed] = referralFrontFields(info);
  return {
    primary: [{ key: code!.key, label: code!.label, value: code!.value }],
    secondary: [
      {
        key: "ref-friend",
        label: "DIN VEN FÅR",
        value: info.newCustomerReward,
        textAlignment: "PKTextAlignmentLeft",
      },
      owed!,
    ],
  };
}
