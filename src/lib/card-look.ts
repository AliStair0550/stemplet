// Kortet: butikkens faelles kortdesign paa tvaers af produkterne. Udseendet
// (stil, farver, logo, eget billede, knapper) ligger ét sted; reglerne for
// stempler og henvisninger ligger hos hvert produkt. Ren logik uden database,
// saa den kan enhedstestes og bruges baade i dashboardet og i Wallet-passet.

export const CARD_STYLES = ["color", "photo", "pattern", "stamps"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export const CARD_STYLE_LABEL: Record<CardStyle, string> = {
  color: "Farve",
  photo: "Dit billede",
  pattern: "Mønster",
  stamps: "Stempler",
};

/** Knapper paa kortet (iOS 27 "Featured Actions"), hoejst to. */
export const CARD_ACTIONS = ["book", "henvis", "beloenninger"] as const;
export type CardAction = (typeof CARD_ACTIONS)[number];
export const MAX_CARD_ACTIONS = 2;

export const CARD_ACTION_LABEL: Record<CardAction, string> = {
  book: "Book tid",
  henvis: "Henvis en ven",
  beloenninger: "Se dine belønninger",
};

export type CardLookContext = {
  stampsEnabled: boolean;
  referralsEnabled: boolean;
  bookingUrl: string | null;
};

export function isCardStyle(v: unknown): v is CardStyle {
  return typeof v === "string" && (CARD_STYLES as readonly string[]).includes(v);
}

/** Kan stilen bruges? "Stempler" kraever Stemplet. */
export function styleAvailable(style: CardStyle, ctx: CardLookContext): boolean {
  return style !== "stamps" || ctx.stampsEnabled;
}

/** Den stil, kortet faktisk vises med (falder tilbage til Farve). */
export function effectiveStyle(style: string, ctx: CardLookContext, hasArtwork: boolean): CardStyle {
  if (!isCardStyle(style) || !styleAvailable(style, ctx)) return "color";
  if (style === "photo" && !hasArtwork) return "color";
  return style;
}

/** Hvorfor en knap ikke kan vaelges (null = kan vaelges). */
export function actionUnavailableReason(action: CardAction, ctx: CardLookContext): string | null {
  if (action === "book" && !(ctx.bookingUrl && /^https?:\/\//i.test(ctx.bookingUrl))) {
    return "Tilføj et booking-link under Regler, Henvisninger.";
  }
  if (action === "henvis" && !ctx.referralsEnabled) return "Kræver Henvisninger.";
  return null;
}

/** Gyldige, tilgaengelige knapper i valgt raekkefoelge, hoejst to. */
export function normalizeActions(actions: readonly string[], ctx: CardLookContext): CardAction[] {
  const out: CardAction[] = [];
  for (const a of actions) {
    if (!(CARD_ACTIONS as readonly string[]).includes(a)) continue;
    const act = a as CardAction;
    if (out.includes(act) || actionUnavailableReason(act, ctx)) continue;
    out.push(act);
    if (out.length === MAX_CARD_ACTIONS) break;
  }
  return out;
}

/** Forslag, naar butikken ikke selv har valgt: Book tid og Henvis en ven, ellers belønninger. */
export function suggestedActions(ctx: CardLookContext): CardAction[] {
  return normalizeActions(["book", "henvis", "beloenninger"], ctx);
}
