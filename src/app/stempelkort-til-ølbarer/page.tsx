import { permanentRedirect } from "next/navigation";

// "Ølbarer" er omdoebt til "Barer" (bredere: oel og vin). Denne rute sender den
// gamle URL varigt videre (308) til den nye, saa gamle links og indeksering ikke
// rammer en 404. Rute-baseret redirect frem for next.config, fordi non-ASCII
// (oe) i redirect-source ikke matcher paalideligt.
export default function Page() {
  permanentRedirect("/stempelkort-til-barer");
}
