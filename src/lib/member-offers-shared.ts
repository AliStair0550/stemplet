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

// ── Slutning i dansk tid ──────────────────────────────────────────────
// Ejeren vaelger en dato og evt. et klokkeslaet i dansk tid. Uden klokkeslaet
// gaelder tilbuddet hele dagen (til 23.59.59). Gamle tilbud blev gemt som
// 23.59.59 UTC; de vises stadig som "til og med" den dato.

const TZ = "Europe/Copenhagen";

/** Dato ("YYYY-MM-DD") og klokkeslaet ("HH:MM") i dansk tid. */
export function dkParts(d: Date): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** Et dansk tidspunkt som Date (tager hoejde for sommer- og vintertid). */
export function dkLocal(date: string, time: string, sec = 0, ms = 0): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y!, mo! - 1, d!, h!, mi!, sec, ms);
  // Forskellen mellem dansk tid og UTC lige der (1 eller 2 timer).
  const offset = (t: number) => {
    const p = dkParts(new Date(t));
    return Date.UTC(+p.date.slice(0, 4), +p.date.slice(5, 7) - 1, +p.date.slice(8, 10), +p.time.slice(0, 2), +p.time.slice(3, 5)) - Math.floor(t / 60_000) * 60_000;
  };
  const guess = wall - offset(wall);
  return new Date(wall - offset(guess));
}

/** Slutningen af et tilbud ud fra formularens felter (tom dato = ingen slutning). */
export function offerEndsAt(endsOn: string | undefined, endsTime?: string): Date | null {
  if (!endsOn || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return null;
  if (endsTime && /^\d{2}:\d{2}$/.test(endsTime)) return dkLocal(endsOn, endsTime);
  return dkLocal(endsOn, "23:59", 59, 999);
}

/** Var slutningen "hele dagen" (ingen bestemt tid)? Ogsaa gamle UTC-tilbud. */
function endsAllDay(d: Date): boolean {
  return dkParts(d).time === "23:59" || (d.getUTCHours() === 23 && d.getUTCMinutes() === 59 && d.getUTCSeconds() === 59);
}

/** Felterne til formularen, naar et tilbud rettes. */
export function offerEndFields(iso: string | null): { endsOn: string; endsTime: string } {
  if (!iso) return { endsOn: "", endsTime: "" };
  const d = new Date(iso);
  if (d.getUTCHours() === 23 && d.getUTCMinutes() === 59 && d.getUTCSeconds() === 59) {
    return { endsOn: d.toISOString().slice(0, 10), endsTime: "" };
  }
  const p = dkParts(d);
  return { endsOn: p.date, endsTime: endsAllDay(d) ? "" : p.time };
}

/** "Til og med 10. nov. 2026" eller "Slutter 10. nov. kl. 14.00". */
export function offerEndLabel(d: Date): string {
  if (d.getUTCHours() === 23 && d.getUTCMinutes() === 59 && d.getUTCSeconds() === 59) {
    return `Til og med ${new Intl.DateTimeFormat("da-DK", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(d)}`;
  }
  const date = new Intl.DateTimeFormat("da-DK", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d);
  if (endsAllDay(d)) return `Til og med ${date}`;
  return `Slutter ${date} kl. ${dkParts(d).time.replace(":", ".")}`;
}
