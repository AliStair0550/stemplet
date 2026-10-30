// Apples "hvilke pass er aendret siden sidst" for en enhed. lastUpdated er
// tidsstemplet (ms) for det senest aendrede kort; enheden sender det tilbage som
// passesUpdatedSince naeste gang, saa den kun henter kort, der er aendret siden.

export type DeviceCard = { serial: string; passUpdatedAt: Date };

export function changedSince(
  cards: DeviceCard[],
  since: string | null,
): { serialNumbers: string[]; lastUpdated: string } | null {
  const sinceMs = since && /^\d+$/.test(since) ? Number(since) : null;
  const changed = sinceMs === null ? cards : cards.filter((c) => c.passUpdatedAt.getTime() > sinceMs);
  if (changed.length === 0) return null;
  const latest = Math.max(...changed.map((c) => c.passUpdatedAt.getTime()));
  return { serialNumbers: [...new Set(changed.map((c) => c.serial))], lastUpdated: String(latest) };
}
