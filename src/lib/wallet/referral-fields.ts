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
export function referralFrontFields(info: ReferralPassInfo): PassField[] {
  const owed: PassField = {
    key: "ref-owed",
    label: "TIL GODE",
    value: owedLabel(info.rewards),
    textAlignment: "PKTextAlignmentRight",
  };
  if (info.announce && info.rewards.length > 0) {
    owed.changeMessage =
      info.referralsDone > 0
        ? "Din ven har været her. Du har nu %@ til gode."
        : "Du har nu %@ til gode.";
  }
  return [
    { key: "ref-code", label: "DIN KODE", value: info.code, textAlignment: "PKTextAlignmentCenter" },
    owed,
  ];
}

/** Bagsiden: deling, belønninger, antal venner, betingelser og kundesiden. */
export function referralBackFields(info: ReferralPassInfo): PassField[] {
  const n = info.referralsDone;
  const fields: PassField[] = [
    {
      key: "ref-share",
      label: "Del din kode",
      value: `Send linket til en ven. Vennen får rabat, og du får en belønning, når vennen har været her: ${info.shareUrl}`,
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
