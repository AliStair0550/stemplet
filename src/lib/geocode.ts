import "server-only";

// Geokod en dansk adresse til lat/lng via DAWA (Danmarks Adressers Web API,
// dataforsyningen.dk). Officielt, gratis, ingen noegle, og altid korrekt
// postnummer. Adressen er en fast query-param mod et fast host (ingen SSRF).
// Samme datakilde som autocomplete paa klienten, saa en valgt adresse altid
// kan slaas op.
export type GeoHit = { lat: number; lng: number; label: string };

export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  try {
    // struktur=mini giver et fladt svar med x (laengdegrad) og y (breddegrad)
    // i WGS84 samt betegnelse (den fulde, formaterede adresse).
    const url =
      "https://api.dataforsyningen.dk/adgangsadresser?struktur=mini&per_side=1&q=" +
      encodeURIComponent(address);
    const res = await fetch(url, {
      headers: { "User-Agent": "Stemplet/1.0 (+https://stemplet.alius.dk)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      x?: number;
      y?: number;
      betegnelse?: string;
    }[];
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit || typeof hit.x !== "number" || typeof hit.y !== "number") {
      return null;
    }
    if (!Number.isFinite(hit.x) || !Number.isFinite(hit.y)) return null;
    return { lat: hit.y, lng: hit.x, label: hit.betegnelse ?? address };
  } catch {
    return null;
  }
}

/** Afrund til ~11 m: rigeligt til en geofence, og vi gemmer ikke mere end noedvendigt. */
export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
