import "server-only";
import { PKPass } from "passkit-generator";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import path from "node:path";
import { walletIds, walletCertificates } from "./config";
import { buildStripImages } from "./strip";
import { isPrivateAddress } from "../integrations";
import { APP_URL } from "../env";
import { hexToRgb, contrastText } from "../brand";

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

async function loadLogo(logoUrl: string | null): Promise<Buffer | null> {
  if (logoUrl) {
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
  }
  return null;
}

/** Bygger et .pkpass (storeCard) for et kundekort. */
export async function buildPass(input: PassInput): Promise<Buffer> {
  const { passTypeIdentifier, teamIdentifier } = walletIds();
  const certificates = walletCertificates();

  const iconBuf = await readFile(
    path.join(process.cwd(), "public", "icon-192.png"),
  );
  const logoBuf = await loadLogo(input.logoUrl);

  const bg = rgbString(input.primaryColor);
  const fg = rgbString(contrastText(input.primaryColor));
  // Dæmpet label-farve (tekstfarven trukket ~1/3 mod baggrunden).
  const labelCol = blendRgb(contrastText(input.primaryColor), input.primaryColor, 0.34);
  const rewardReady = input.stamps >= input.required;

  // Stempel-gitteret som strip-billede, saa kortet viser de faktiske stempler.
  const strip = await buildStripImages({
    stamps: input.stamps,
    required: input.required,
    stampIcon: input.stampIcon,
    primaryColor: input.primaryColor,
    textColor: input.textColor,
  });

  const images: Record<string, Buffer> = {
    "icon.png": iconBuf,
    "icon@2x.png": iconBuf,
    "strip.png": strip.x1,
    "strip@2x.png": strip.x2,
    "strip@3x.png": strip.x3,
  };
  // Butikkens eget logo i toppen. Har butikken ingen, viser vi kun navnet
  // (logoText), ikke Stemplet-badgen, saa passet er fuldt i butikkens brand.
  if (logoBuf) {
    images["logo.png"] = logoBuf;
    images["logo@2x.png"] = logoBuf;
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
    logoText: input.businessName,
    webServiceURL: `${APP_URL}/api/wallet`,
    authenticationToken: input.authToken,
    sharingProhibited: true,
  });

  pass.type = "storeCard";

  pass.headerFields.push({
    key: "stamps",
    // Klamp visningen: under carry-vinduet kan raa stamps vaere required+1,
    // men kortet skal aldrig vise "11/10".
    label: "STEMPLER",
    value: `${Math.min(input.stamps, input.required)}/${input.required}`,
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

  return pass.getAsBuffer();
}
