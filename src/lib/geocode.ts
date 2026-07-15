import "server-only";

// Geokod en adresse til lat/lng via OpenStreetMap (Nominatim). Gratis, ingen
// noegle. Adressen er en fast query-param mod et fast host (ingen SSRF). Bruges
// kun sjaeldent (butik saetter sin adresse), saa vi er godt inden for
// brugspolitikken. Bias mod danske adresser.
export type GeoHit = { lat: number; lng: number; label: string };

export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&countrycodes=dk&q=" +
      encodeURIComponent(address);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Stemplet/1.0 (+https://stemplet.alius.dk)",
        "Accept-Language": "da",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit?.lat || !hit?.lon) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, label: hit.display_name ?? address };
  } catch {
    return null;
  }
}

/** Afrund til ~11 m: rigeligt til en geofence, og vi gemmer ikke mere end noedvendigt. */
export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
