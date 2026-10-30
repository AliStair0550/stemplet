// Folka: virksomheden bag produkterne (Stemplet og Henvisninger). EEN kilde for
// navn, adresser og farve, saa et navneskift kun kraever en aendring her.
// Slutkunder ser butikkens navn (Wallet-kortet, mails om kortet); Folka ses af
// butiksejeren (login, dashboard, kontomails) og som "Drevet af Folka".
import { APP_URL } from "./env";

export const PLATFORM = {
  name: "Folka",
  url: "https://folka.dk",
  contactEmail: "hej@folka.dk",
  /** Servicenummer til butikkerne og deres personale. */
  supportPhone: "+45 60 51 65 38",
  /** Folkas moerkeblaa (ikonets baggrund, folka.dk). */
  color: "#061C3D",
} as const;

/** Appens vaert uden protokol, fx "kort.folka.dk" (til tekst som "kort.folka.dk/kasse"). */
export const APP_HOST = APP_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
