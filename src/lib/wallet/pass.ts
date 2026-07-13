import "server-only";
import { PKPass } from "passkit-generator";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import path from "node:path";
import { walletIds, walletCertificates } from "./config";
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
  rewardText: string;
  stamps: number;
  required: number;
  showPoweredBy: boolean;
};

function rgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

async function loadLogo(logoUrl: string | null): Promise<Buffer> {
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
      // falder tilbage til standardikonet
    }
  }
  return readFile(path.join(process.cwd(), "public", "icon-512.png"));
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
  const rewardReady = input.stamps >= input.required;

  const pass = new PKPass(
    {
      "icon.png": iconBuf,
      "icon@2x.png": iconBuf,
      "logo.png": logoBuf,
      "logo@2x.png": logoBuf,
    },
    certificates,
    {
      passTypeIdentifier,
      teamIdentifier,
      organizationName: input.businessName,
      description: `Stempelkort - ${input.businessName}`,
      serialNumber: input.serial,
      foregroundColor: fg,
      backgroundColor: bg,
      labelColor: fg,
      logoText: input.businessName,
      webServiceURL: `${APP_URL}/api/wallet`,
      authenticationToken: input.authToken,
      sharingProhibited: true,
    },
  );

  pass.type = "storeCard";

  pass.headerFields.push({
    key: "stamps",
    label: "STEMPLER",
    value: `${input.stamps}/${input.required}`,
  });

  pass.primaryFields.push({
    key: "reward",
    label: "BELOENNING",
    value: input.rewardText,
  });

  pass.secondaryFields.push({
    key: "status",
    label: "STATUS",
    value: rewardReady
      ? "Belønning klar"
      : `Mangler ${input.required - input.stamps}`,
  });

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
