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
  donut:
    '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.7"/><path d="M8.6 6.9l.5 1M15.1 7.4l-.5 1M17.3 11.1l-1 .35M16.8 15.1l-1-.3M7.1 15.9l.9-.7M6.5 10.7l1 .4"/>',
  cake:
    '<path d="M5 11h14v7.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11Z"/><path d="M5 11c1.15 1.15 2.3 1.15 3.5 0s2.35-1.15 3.5 0 2.3 1.15 3.5 0 2.35-1.15 3.5 0"/><path d="M12 7v3.4"/><path d="M12 7c-.55-.5-.55-1.4 0-2 .55.6.55 1.5 0 2Z" fill="currentColor" stroke="none"/>',
  bread:
    '<path d="M4.7 13.2c0-3.1 3.3-4.9 7.3-4.9s7.3 1.8 7.3 4.9v3.6a1 1 0 0 1-1 1H5.7a1 1 0 0 1-1-1v-3.6Z"/><path d="M9 9.3 7.9 12M12 8.7v3M15 9.3l1.1 2.7"/>',
  pizza:
    '<path d="M12 3c4 0 7.5 2.2 9 5.5L12 21 3 8.5C4.5 5.2 8 3 12 3Z"/><path d="M5 9.5c4-1.5 10-1.5 14 0"/><circle cx="10" cy="10.5" r="0.7" fill="currentColor"/><circle cx="13.5" cy="12.5" r="0.7" fill="currentColor"/>',
  burger:
    '<path d="M4 9.5c0-3 3.6-5 8-5s8 2 8 5"/><path d="M4 14h16M5 11h14"/><path d="M5 14c0 2.5 3 4 7 4s7-1.5 7-4"/>',
  hotdog:
    '<path d="M3.6 12a3 3 0 0 1 3-3h10.8a3 3 0 0 1 0 6H6.6a3 3 0 0 1-3-3Z"/><path d="M6.5 12h11"/><path d="M7 11.4c.9.75 1.85.75 2.75 0s1.85-.75 2.75 0 1.85.75 2.75 0"/>',
  sandwich:
    '<path d="M4 9.5 12 4l8 5.5"/><path d="M4 9.5h16M4 9.5v3.5c0 .6.4 1 1 1M20 9.5v3.5c0 .6-.4 1-1 1"/><path d="M5 14c1.3 1 2.6 1 3.9 0s2.6-1 3.9 0 2.6 1 3.9 0"/><path d="M6 17h12"/>',
  taco:
    '<path d="M4.3 15a7.7 7.7 0 0 1 15.4 0"/><path d="M4.3 15h15.4"/><path d="M6 13.6c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0"/>',
  fish:
    '<path d="M4 12c2.8-3.8 8.2-3.8 11 0-2.8 3.8-8.2 3.8-11 0Z"/><path d="M15 12l4.5-2.6v5.2L15 12Z"/><circle cx="7.6" cy="11.3" r="0.6" fill="currentColor" stroke="none"/>',
  icecream:
    '<path d="M8 10a4 4 0 0 1 8 0"/><path d="M7.5 11h9l-4.5 9-4.5-9Z"/><path d="M8.5 14h7"/>',
  smoothie:
    '<path d="M7 8.5h10l-1.1 10.6a1 1 0 0 1-1 .9H9.1a1 1 0 0 1-1-.9L7 8.5Z"/><path d="M6.6 8.5h10.8"/><path d="M13.5 8.5 15.2 4.2"/>',
  beer:
    '<path d="M7 9h8v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Z"/><path d="M15 11h2a1.6 1.6 0 0 1 0 4h-2"/><path d="M7 9c-.3-1.9.7-3 1.9-2.6C9.5 5 10.9 5 11.7 5.9 12.9 5.2 14.1 6 14.1 7.2c0 .7-.3 1.3-.8 1.8"/><path d="M9.2 12.2v4.6M12 12.2v4.6"/>',
  wine: '<path d="M7 4h10c0 4-2 7-5 7S7 8 7 4Z"/><path d="M12 11v6M9 20h6"/>',
  cocktail:
    '<path d="M4.5 5.5h15l-7.5 8-7.5-8Z"/><path d="M12 13.5v5.5M8.5 19.5h7"/><path d="M14.5 6 17 4"/><circle cx="17.4" cy="3.7" r="1" fill="currentColor"/>',
  scissors:
    '<circle cx="6.5" cy="7.2" r="2"/><circle cx="6.5" cy="16.8" r="2"/><path d="M8.3 8.4 19 16M8.3 15.6 19 8"/><circle cx="11.4" cy="12" r="0.5" fill="currentColor"/>',
  comb:
    '<rect x="4" y="7.5" width="16" height="4" rx="1"/><path d="M6 11.5v5M9 11.5v5M12 11.5v5M15 11.5v5M18 11.5v5"/>',
  mirror:
    '<ellipse cx="12" cy="8.8" rx="5" ry="5.6"/><path d="M10.9 14.3h2.2v5.4a1.1 1.1 0 0 1-2.2 0v-5.4Z"/><path d="M9.5 7.6a2.8 2.8 0 0 1 2-2.1"/>',
  lipstick:
    '<rect x="8" y="13" width="8" height="7" rx="1"/><path d="M9 13v-2.6h6V13"/><path d="M9.9 10.4V6.9l4.2-2.7v6.2"/>',
  nailpolish:
    '<rect x="6.8" y="11" width="10.4" height="9" rx="2.4"/><path d="M10 11V9.2h4V11"/><path d="M10.6 9.2V3.8h2.8v5.4"/>',
  lashes:
    '<path d="M4.5 10.5c2 3 4.5 4.6 7.5 4.6s5.5-1.6 7.5-4.6"/><path d="M6.9 13.4l-1.4 2.1M9.9 14.7l-.6 2.5M14.1 14.7l.6 2.5M17.1 13.4l1.4 2.1"/>',
  brush:
    '<path d="M4.6 19.4l5.6-5.6"/><path d="M9.2 12.4l2.4 2.4 1.6-1.6-2.4-2.4Z"/><path d="M10.8 10.8c.4-3.3 3.4-6.1 8.4-6.6-.5 5-3.3 8-6.6 8.4"/><path d="M13.6 10.4l2.6-2.6"/>',
  perfume:
    '<rect x="6" y="10" width="12" height="10" rx="2.5"/><path d="M10 10V7.6h4V10"/><path d="M10.6 7.6V5h2.8v2.6"/><path d="M15.8 4.6h1.6M16.4 2.8l1 .9M16.4 6.4l1-.9"/><path d="M9 14.6h6"/>',
  sparkle:
    '<path d="M11 4c.5 3.2 1.3 4 4.5 4.5-3.2.5-4 1.3-4.5 4.5-.5-3.2-1.3-4-4.5-4.5 3.2-.5 4-1.3 4.5-4.5Z"/><path d="M17.5 14c.2 1.4.6 1.8 2 2-1.4.2-1.8.6-2 2-.2-1.4-.6-1.8-2-2 1.4-.2 1.8-.6 2-2Z"/>',
  flower:
    '<path d="M8.5 7c0 2.5 1.6 4.5 3.5 4.5S15.5 9.5 15.5 7c-1.3 0-2.5.7-3.5 2-1-1.3-2.2-2-3.5-2Z"/><path d="M12 11.5V19"/><path d="M12 15.4c-1.5 0-2.7-.9-3.2-2.3M12 15.4c1.5 0 2.7-.9 3.2-2.3"/>',
  lotus:
    '<path d="M12 5c-1.8 2-2.6 4.2-2.6 6.4S10.6 15.9 12 17c1.4-1.1 2.6-3.3 2.6-5.6S13.8 7 12 5Z"/><path d="M12 17c-3 .2-5.8-1.5-7.2-4.8 2.3-.6 4.3-.2 5.7 1M12 17c3 .2 5.8-1.5 7.2-4.8-2.3-.6-4.3-.2-5.7 1"/><path d="M6 19.8h12"/>',
  stones:
    '<ellipse cx="12" cy="17.6" rx="7" ry="2.4"/><ellipse cx="12" cy="12.7" rx="5" ry="2"/><ellipse cx="12" cy="8.5" rx="3.2" ry="1.6"/><path d="M12 6.9c.2-1.5 1.2-2.5 2.8-2.7-.2 1.5-1.2 2.5-2.8 2.7Z"/>',
  hand:
    '<path d="M8.2 12.5V6.6a1.2 1.2 0 0 1 2.4 0V11M10.6 11V5.2a1.2 1.2 0 0 1 2.4 0V11M13 11V5.9a1.2 1.2 0 0 1 2.4 0V11.5M15.4 9.3a1.2 1.2 0 0 1 2.4 0V14c0 3.3-2.4 6-5.6 6-2.3 0-3.7-1-5-3l-2.1-3.4a1.2 1.2 0 0 1 2-1.3l1.1 1.6"/>',
  drop:
    '<path d="M12 3.8c3 3.6 5.5 6.6 5.5 9.9a5.5 5.5 0 0 1-11 0c0-3.3 2.5-6.3 5.5-9.9Z"/><path d="M9.4 14a2.7 2.7 0 0 0 2.2 2.6"/>',
  candle:
    '<rect x="8" y="10.5" width="8" height="9.5" rx="1"/><path d="M12 9.1v1.4"/><path d="M12 3.6c1.3 1.4 1.9 2.5 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-1 .6-2.1 1.9-3.5Z"/><path d="M11 10.5v2.6"/>',
  leaf:
    '<path d="M5 19c0-8 6-13.5 14-14 .8 8-5 14.2-14 14Z"/><path d="M8.5 15.5c2.8-3.2 5.6-5.2 8.5-6.2"/>',
  paw:
    '<circle cx="8" cy="9.2" r="1.4"/><circle cx="12" cy="7.9" r="1.5"/><circle cx="16" cy="9.2" r="1.4"/><path d="M12 11.2c-2.4 0-4.4 1.8-4.4 3.7 0 1.5 1.3 2.3 2.9 2 .9-.2 2.1-.2 3 0 1.6.3 2.9-.5 2.9-2 0-1.9-2-3.7-4.4-3.7Z"/>',
  gift:
    '<rect x="4.7" y="9.8" width="14.6" height="9.7" rx="1"/><path d="M3.6 9.8h16.8M12 9.8v9.7"/><path d="M12 9.8C9.5 9.8 8 8.9 8 7.4S9.4 5.4 12 9.8Z"/><path d="M12 9.8C14.5 9.8 16 8.9 16 7.4S14.6 5.4 12 9.8Z"/>',
  heart:
    '<path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z"/>',
  star: '<path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16.9 7.4 18.2l.9-5.2L4.5 9.3l5.2-.7L12 4Z"/>',
  crown:
    '<path d="M4.5 8.5l3 3 4.5-5 4.5 5 3-3-1 9.5H5.5Z"/><path d="M5.5 21h13"/>',
  custom: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
};
