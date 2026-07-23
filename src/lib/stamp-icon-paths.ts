import type { StampIconKey } from "./brand";

// Eneste kilde til stempel-ikonernes SVG-stier (inner markup, viewBox 0 0 24 24,
// stroke = currentColor, fill none medmindre en form eksplicit saetter fill).
// Bruges af StampIcon (kortet + designeren), Wallet-strip'en og hero-animationen,
// saa ikon-sproget er 100 % identisk overalt og aldrig kan komme ud af sync.
// Tynde, runde line-art figurer i Alius-stil, tegnet til at vaere laesbare helt
// ned til ~20 px (stemplerne paa kortet).
export const STAMP_ICON_PATHS: Record<StampIconKey, string> = {
  coffee:
    '<path d="M6 8h9v4.5a4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5V8Z"/><path d="M15 9.3h2.2a2.3 2.3 0 0 1 0 4.6H15"/><path d="M6 19.6h9"/><path d="M9 2.7c-.5.8-.5 1.6 0 2.4M12 2.7c-.5.8-.5 1.6 0 2.4"/>',
  croissant:
    '<path d="M4.8 14c0-4 3.2-7 7.2-7s7.2 3 7.2 7c-1.4-1.1-2.7-1.4-3.9-1-.9-1.4-2-2-3.3-2s-2.4.6-3.3 2c-1.2-.4-2.5-.1-3.9 1Z"/>',
  cupcake:
    '<path d="M7 13h10l-1 6.4a1 1 0 0 1-1 .9H9a1 1 0 0 1-1-.9L7 13Z"/><path d="M10 13.5l-.5 6M14 13.5l.5 6"/><path d="M6.6 13c-1.5 0-2.5-1.6-1.6-2.9.5-.8 1.5-1 2.2-.7-.4-1.8 1-3.4 2.7-3 .6.1 1.1.5 1.5 1 .6-1.5 2.4-2 3.6-1 .8.6 1.1 1.7.8 2.6 1.5-.2 2.7 1 2.5 2.4-.1 1-1 1.6-1.9 1.6"/>',
  pizza:
    '<path d="M12 3c4 0 7.5 2.2 9 5.5L12 21 3 8.5C4.5 5.2 8 3 12 3Z"/><path d="M5 9.5c4-1.5 10-1.5 14 0"/><circle cx="10" cy="10.5" r="0.7" fill="currentColor"/><circle cx="13.5" cy="12.5" r="0.7" fill="currentColor"/>',
  burger:
    '<path d="M4 9.5c0-3 3.6-5 8-5s8 2 8 5"/><path d="M4 14h16M5 11h14"/><path d="M5 14c0 2.5 3 4 7 4s7-1.5 7-4"/>',
  icecream:
    '<path d="M8 10a4 4 0 0 1 8 0"/><path d="M7.5 11h9l-4.5 9-4.5-9Z"/><path d="M8.5 14h7"/>',
  beer:
    '<path d="M7 9h8v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Z"/><path d="M15 11h2a1.6 1.6 0 0 1 0 4h-2"/><path d="M7 9c-.3-1.9.7-3 1.9-2.6C9.5 5 10.9 5 11.7 5.9 12.9 5.2 14.1 6 14.1 7.2c0 .7-.3 1.3-.8 1.8"/><path d="M9.2 12.2v4.6M12 12.2v4.6"/>',
  wine: '<path d="M7 4h10c0 4-2 7-5 7S7 8 7 4Z"/><path d="M12 11v6M9 20h6"/>',
  cocktail:
    '<path d="M4.5 5.5h15l-7.5 8-7.5-8Z"/><path d="M12 13.5v5.5M8.5 19.5h7"/><path d="M14.5 6 17 4"/><circle cx="17.4" cy="3.7" r="1" fill="currentColor"/>',
  scissors:
    '<circle cx="6.5" cy="7.2" r="2"/><circle cx="6.5" cy="16.8" r="2"/><path d="M8.3 8.4 19 16M8.3 15.6 19 8"/><circle cx="11.4" cy="12" r="0.5" fill="currentColor"/>',
  sparkle:
    '<path d="M11 4c.5 3.2 1.3 4 4.5 4.5-3.2.5-4 1.3-4.5 4.5-.5-3.2-1.3-4-4.5-4.5 3.2-.5 4-1.3 4.5-4.5Z"/><path d="M17.5 14c.2 1.4.6 1.8 2 2-1.4.2-1.8.6-2 2-.2-1.4-.6-1.8-2-2 1.4-.2 1.8-.6 2-2Z"/>',
  flower:
    '<path d="M8.5 7c0 2.5 1.6 4.5 3.5 4.5S15.5 9.5 15.5 7c-1.3 0-2.5.7-3.5 2-1-1.3-2.2-2-3.5-2Z"/><path d="M12 11.5V19"/><path d="M12 15.4c-1.5 0-2.7-.9-3.2-2.3M12 15.4c1.5 0 2.7-.9 3.2-2.3"/>',
  leaf:
    '<path d="M5 19c0-8 6-13.5 14-14 .8 8-5 14.2-14 14Z"/><path d="M8.5 15.5c2.8-3.2 5.6-5.2 8.5-6.2"/>',
  heart:
    '<path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z"/>',
  star: '<path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16.9 7.4 18.2l.9-5.2L4.5 9.3l5.2-.7L12 4Z"/>',
  crown:
    '<path d="M4.5 8.5l3 3 4.5-5 4.5 5 3-3-1 9.5H5.5Z"/><path d="M5.5 21h13"/>',
  custom: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
};
