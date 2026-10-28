import type { RewardType } from "@prisma/client";

// Tekster til henvisningssiden, udledt af butikkens regel. Ren logik uden I/O,
// saa baade server og klient kan bruge den, og den kan enhedstestes.
// Tone (docs/henvisninger.md): korte saetninger, konkrete tal, ingen udraabstegn.

// Haardt mellemrum, saa "100 kr." aldrig knaekker over to linjer.
const NBSP = "\u00A0";

/** "100 kr.", "3 stempler", "1 stempel" eller servicen selv ("gratis klip"). */
export function rewardPhrase(type: RewardType, value: string): string {
  const v = value.trim();
  if (type === "AMOUNT") return `${v}${NBSP}kr.`;
  if (type === "STAMPS") return v === "1" ? `1${NBSP}stempel` : `${v}${NBSP}stempler`;
  // Fri tekst midt i en saetning: lille forbogstav ("Gratis klip" -> "gratis
  // klip"), men ikke for forkortelser ("SPA-behandling" bliver staaende).
  return /^\p{Lu}\p{Ll}/u.test(v) ? v.charAt(0).toLowerCase() + v.slice(1) : v;
}

/** Foerste fornavn til overskriften "Sara har givet dig ...". */
export function firstName(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Delbart link til butikkens side med kundens kode. */
export function referralShareUrl(appUrl: string, slug: string, code: string): string {
  return `${appUrl}/k/${encodeURIComponent(slug)}?k=${encodeURIComponent(code)}`;
}

/** Den faerdige delebesked (Web Share API / kopiér). */
export function referralShareText(shopName: string, newCustomerReward: string): string {
  return `Jeg har en rabat til dig hos ${shopName}: ${newCustomerReward} ved dit første besøg.`;
}

/**
 * Fortolker en beloenning skrevet som fri tekst ved oprettelsen: "150 kr.",
 * "1.000 kr", "200,-" og "100 kr. rabat" bliver et beloeb; alt andet ("gratis
 * vask") en behandling. Tom tekst giver null.
 */
export function parseRewardInput(raw: string): { type: "AMOUNT" | "SERVICE"; value: string } | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return null;
  const n = t.replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2");
  const m = /^(\d{1,6})\s*(kr\.?|kroner|dkk|,-)?(\s+(i\s+)?rabat)?$/i.exec(n);
  if (m && /^[1-9]/.test(m[1]!)) return { type: "AMOUNT", value: m[1]! };
  return { type: "SERVICE", value: t.slice(0, 80) };
}
