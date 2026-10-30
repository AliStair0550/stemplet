import { STAMP_ICON_PATHS } from "./stamp-icon-paths";
import { isStampIcon, type StampIconKey } from "./brand";

// Faelles smaating til delingsbillederne (next/og): stempel-ikoner som billeder,
// saa de tegnes ens med kortet og Wallet.

export function ogIcon(key: string, color: string): string {
  const k: StampIconKey = isStampIcon(key) ? key : "coffee";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="${color}">${STAMP_ICON_PATHS[k]}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Hex med alpha (rgba) til next/og-stilarter. */
export function ogRgba(hex: string, a: number): string {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "061C3D";
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}
