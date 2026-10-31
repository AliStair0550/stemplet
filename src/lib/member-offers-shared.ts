// Konstanter og tekst til "Tilbud og fordele", som ogsaa bruges i browseren
// (OffersManager). Uden zod, saa valideringsbiblioteket (ca. 60 KB) ikke kommer
// med i siden; valideringen ligger i member-offers.ts paa serveren.

export const OFFER_KINDS = ["OFFER", "PARTNER"] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];
export const MAX_OFFERS_PER_KIND = 12;
export const OFFER_TITLE_MAX = 60;
export const OFFER_TEXT_MAX = 200;

/** Faerdig pushbesked om et nyt tilbud eller en ny partner (rettes, foer den sendes). */
export function offerPushText(o: { kind: OfferKind; title: string; partnerName?: string | null }, max = 150): string {
  const t = o.title.trim().replace(/[.:]+$/, "");
  const text =
    o.kind === "PARTNER" && o.partnerName
      ? `Ny fordel med kortet: ${t} hos ${o.partnerName.trim()}. Vis kortet, så får du rabatten.`
      : `Nyt tilbud til dig med kortet: ${t}. Se det under Tilbud og fordele.`;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
