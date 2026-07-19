import "server-only";
import { PKPass } from "passkit-generator";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import path from "node:path";
import { walletIds, walletCertificates } from "./config";
import { buildStripImages } from "./strip";
import { isPrivateAddress } from "../integrations";
import { APP_URL } from "../env";
import {
  hexToRgb,
  contrastText,
  isCardReadable,
  normalizeHex,
  DEFAULT_PRIMARY,
} from "../brand";

type PassInput = {
  serial: string;
  authToken: string;
  businessName: string;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  stampIcon: string;
  rewardText: string;
  stamps: number;
  required: number;
  showPoweredBy: boolean;
  latitude: number | null;
  longitude: number | null;
};

function rgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

// Blander to farver (t=0 -> a, t=1 -> b). Bruges til en DAEMPET label-farve
// (tekstfarven trukket mod baggrunden), saa labels er diskrete og vaerdierne
// popper - som paa et Apple-kort.
function blendRgb(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const m = (x: number, y: number) => Math.round(x * (1 - t) + y * t);
  return `rgb(${m(a.r, b.r)}, ${m(a.g, b.g)}, ${m(a.b, b.b)})`;
}

/**
 * Passets farver som rgb()-strenge. Butikkens egen primaryColor slaar igennem;
 * er den tom/ugyldig, falder vi tilbage til Stemplets standard (#2A1A10), saa DB
 * og kode har samme reserve. foregroundColor foelger butikkens tekstfarve, men
 * falder tilbage til en GARANTERET laesbar kontrastfarve (sort/hvid), hvis den
 * ikke er laesbar paa baggrunden. labelColor er en daempet variant (tekstfarven
 * trukket ~1/3 mod baggrunden), saa labels er diskrete og vaerdierne popper.
 * Ren funktion (ingen certs/I/O), saa farve- og kontrast-logikken kan testes.
 */
export function passColors(
  primaryColor: string,
  textColor: string,
): { backgroundColor: string; foregroundColor: string; labelColor: string } {
  const primary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const fgHex = isCardReadable(primary, textColor)
    ? textColor
    : contrastText(primary);
  return {
    backgroundColor: rgbString(primary),
    foregroundColor: rgbString(fgHex),
    labelColor: blendRgb(fgHex, primary, 0.34),
  };
}

// Logo-bufferen cachet pr. URL. utfs-URL'er er indholds-adresserede (et nyt logo
// giver en ny URL), og data-URI'en ER selve indholdet, saa noeglen aendrer sig
// altid ved nyt logo. Derfor slipper gentagne pass-bygninger for DNS-opslag +
// hentning af det samme logo hver gang. Vi cacher kun succes, saa en midlertidig
// fejl kan proeves igen naeste gang.
const logoCache = new Map<string, Buffer>();
const LOGO_CACHE_MAX = 50;

async function loadLogo(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;
  const cached = logoCache.get(logoUrl);
  if (cached) return cached;
  const buf = await fetchLogo(logoUrl);
  if (buf) {
    if (logoCache.size >= LOGO_CACHE_MAX) {
      const oldest = logoCache.keys().next().value;
      if (oldest !== undefined) logoCache.delete(oldest);
    }
    logoCache.set(logoUrl, buf);
  }
  return buf;
}

async function fetchLogo(logoUrl: string): Promise<Buffer | null> {
  try {
    // Data-URI (den normale vej fra kortdesigneren): ingen netvaerkshentning.
    if (logoUrl.startsWith("data:")) {
      const res = await fetch(logoUrl);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } else {
      // Fjern-URL: SSRF-vaern. Afvis interne/private adresser og foelg ikke
      // redirects, saa et logo aldrig kan bruges til at naa intern metadata.
      const url = new URL(logoUrl);
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.hostname
      ) {
        const resolved = await lookup(url.hostname, { all: true });
        if (resolved.some((a) => isPrivateAddress(a.address))) {
          console.error("Logo blokeret (privat adresse):", url.hostname);
        } else {
          const res = await fetch(logoUrl, { redirect: "manual" });
          if (res.ok) return Buffer.from(await res.arrayBuffer());
        }
      }
    }
  } catch {
    // ingen brugbar logo -> vis kun butiksnavnet (ingen Stemplet-badge)
  }
  return null;
}

// Wallet-ikonet er en statisk fil, der aldrig aendrer sig. Laes den een gang pr.
// proces i stedet for ved hver pass-bygning.
let iconBufCache: Buffer | null = null;
async function loadIcon(): Promise<Buffer> {
  if (!iconBufCache) {
    iconBufCache = await readFile(
      path.join(process.cwd(), "public", "icon-192.png"),
    );
  }
  return iconBufCache;
}

/** Bygger et .pkpass (storeCard) for et kundekort. */
export async function buildPass(input: PassInput): Promise<Buffer> {
  const { passTypeIdentifier, teamIdentifier } = walletIds();
  const certificates = walletCertificates();

  // Ikon (cache), logo (netvaerk) og strip-gitteret (sharp-render) afhaenger ikke
  // af hinanden, saa vi koerer dem samtidig i stedet for i raekke. Det tunge trin
  // (strip) overlapper med logo-hentningen.
  const [iconBuf, logoBuf, strip] = await Promise.all([
    loadIcon(),
    loadLogo(input.logoUrl),
    buildStripImages({
      stamps: input.stamps,
      required: input.required,
      stampIcon: input.stampIcon,
      primaryColor: input.primaryColor,
      textColor: input.textColor,
    }),
  ]);

  const {
    backgroundColor: bg,
    foregroundColor: fg,
    labelColor: labelCol,
  } = passColors(input.primaryColor, input.textColor);
  const rewardReady = input.stamps >= input.required;

  const images: Record<string, Buffer> = {
    "icon.png": iconBuf,
    "icon@2x.png": iconBuf,
    "strip.png": strip.x1,
    "strip@2x.png": strip.x2,
    "strip@3x.png": strip.x3,
  };
  // Butikkens eget logo i toppen. Samme hoej-oploeselige buffer paa alle tre
  // taetheder, saa logoet staar knivskarpt ogsaa paa @3x-skaerme (foer manglede
  // logo@3x, saa @3x faldt tilbage paa den mindre @2x og blev uskarp).
  if (logoBuf) {
    images["logo.png"] = logoBuf;
    images["logo@2x.png"] = logoBuf;
    images["logo@3x.png"] = logoBuf;
  }

  const pass = new PKPass(images, certificates, {
    passTypeIdentifier,
    teamIdentifier,
    organizationName: input.businessName,
    description: `Stempelkort - ${input.businessName}`,
    serialNumber: input.serial,
    foregroundColor: fg,
    backgroundColor: bg,
    labelColor: labelCol,
    // Butiksnavnet staar ALTID i logoText, ogsaa naar butikken har et logo. Det
    // er det eneste tekstlige navn, der er synligt, naar kort ligger i STAK i
    // Wallet (alle Stemplet-kort deler passTypeIdentifier og kan ikke skilles ad
    // paa anden vis). Med logo vises baade logo OG navn i toppen.
    logoText: input.businessName,
    webServiceURL: `${APP_URL}/api/wallet`,
    authenticationToken: input.authToken,
    sharingProhibited: true,
  });

  pass.type = "storeCard";

  // Dopamin: naar passet opdateres (efter en stempling), viser iOS denne besked
  // som en notifikation paa laaseskaermen - saa kunden faar et lille "ping" hver
  // gang. %@ erstattes af den nye vaerdi. Beskeden er kontekstuel: et ekstra kick
  // naar kortet bliver fuldt, og en venlig hilsen naar en ny omgang begynder.
  const changeMessage = rewardReady
    ? "Kortet er fuldt. Din belønning er klar."
    : input.stamps === 0
      ? "Ny omgang begynder. Godt gået."
      : "Nyt stempel. Du har nu %@.";

  pass.headerFields.push({
    key: "stamps",
    // Klamp visningen: under carry-vinduet kan raa stamps vaere required+1,
    // men kortet skal aldrig vise "11/10".
    label: "STEMPLER",
    value: `${Math.min(input.stamps, input.required)}/${input.required}`,
    changeMessage,
  });

  // Rent og elegant: strip-gitteret staar oeverst, og kun to SMAA felter under.
  // Ingen "BELØNNING"-label (den giver sig selv), og status staar diskret til
  // hoejre.
  const left = input.required - input.stamps;
  pass.auxiliaryFields.push(
    {
      key: "reward",
      value: input.rewardText,
      textAlignment: "PKTextAlignmentLeft",
    },
    {
      key: "status",
      value: rewardReady ? "Klar" : `${left} tilbage`,
      textAlignment: "PKTextAlignmentRight",
    },
  );

  pass.backFields.push(
    {
      key: "progress",
      label: "Fremgang",
      value: rewardReady
        ? "Kortet er fuldt. Vis det ved kassen og få din belønning."
        : `${input.stamps} af ${input.required} stempler. ${left} til din belønning.`,
    },
    {
      key: "how",
      label: "Sådan virker det",
      value:
        "Vis dette kort ved kassen, eller scan butikkens QR for at få et stempel.",
    },
    {
      key: "reward-back",
      label: "Din belønning",
      value: input.rewardText,
    },
  );

  if (input.showPoweredBy) {
    pass.backFields.push({
      key: "poweredby",
      label: "Drevet af",
      value: "Stemplet - et produkt fra Alius. stemplet.alius.dk",
    });
  }

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: input.serial,
    messageEncoding: "iso-8859-1",
    altText: input.serial,
  });

  // Har butikken sat sin placering, faar passet en "location". Saa dukker
  // kortet op paa kundens laaseskaerm, naar de er i naerheden af butikken:
  // butikken minder selv kunden om sig selv. Ren, native Apple Wallet.
  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    pass.setLocations({
      latitude: input.latitude,
      longitude: input.longitude,
      relevantText: rewardReady
        ? `Din belønning venter hos ${input.businessName}`
        : `Velkommen tilbage hos ${input.businessName}`,
    });
  }

  return pass.getAsBuffer();
}
