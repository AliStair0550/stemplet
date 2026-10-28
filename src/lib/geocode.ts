import "server-only";

// Geokod en dansk adresse til lat/lng via Photon (komoot, OpenStreetMap-data).
// DAWA lukkede i 2026 (svarer 410 Gone), og afloeseren GSearch kraever en token.
// Photon er gratis og uden noegle. Adressen er en fast query-param mod et fast
// host (ingen SSRF). Samme datakilde som autocomplete paa klienten, saa en valgt
// adresse altid kan slaas op. Mangler OSM husnummeret, rammer vi vejen, hvilket
// er rigeligt praecist til en Wallet-geofence.
export type GeoHit = { lat: number; lng: number; label: string };

// Danmark inkl. Bornholm (minLon, minLat, maxLon, maxLat).
const DK_BBOX = "7.9,54.5,15.3,57.8";

export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  try {
    const url =
      `https://photon.komoot.io/api/?limit=1&lang=default&bbox=${DK_BBOX}&q=` +
      encodeURIComponent(address);
    const res = await fetch(url, {
      headers: { "User-Agent": "Stemplet/1.0 (+https://kort.folka.dk)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: [number, number] };
        properties?: { countrycode?: string };
      }[];
    };
    const hit = data.features?.[0];
    if (!hit || hit.properties?.countrycode !== "DK") return null;
    // GeoJSON-raekkefoelge: [laengdegrad, breddegrad].
    const [lng, lat] = hit.geometry?.coordinates ?? [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat: lat as number, lng: lng as number, label: address };
  } catch {
    return null;
  }
}

/** Afrund til ~11 m: rigeligt til en geofence, og vi gemmer ikke mere end noedvendigt. */
export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
