import { timingSafeEqual } from "node:crypto";

// Konstant-tid sammenligning af en "Authorization: Bearer <secret>"-header mod
// den forventede hemmelighed. Laengde-tjekket foerst er ikke hemmeligt;
// timingSafeEqual kraever ens laengde. Bruges af cron- og rollout-ruterne, saa
// de matcher resten af kodebasens timing-safe moenster.
export function bearerAuthorized(
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  return expected.length === got.length && timingSafeEqual(expected, got);
}
