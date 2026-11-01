import type { MetadataRoute } from "next";
import { BRANCHER } from "@/lib/brancher";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://kort.folka.dk";

// Kun offentlige, indekserbare sider. Dashboard, kunde-kort og API er udeladt.
// Senest aendret: salgssiderne og de juridiske sider (opdateres ved stoerre aendringer).
const SITE_UPDATED = new Date("2026-11-01");
const LEGAL_UPDATED = new Date("2026-11-01");

export default function sitemap(): MetadataRoute.Sitemap {
  // Branchesider har danske slugs (aeoeaa); encodeURI giver korrekt
  // procent-encoded <loc> i sitemap-XML'en.
  const brancheUrls: MetadataRoute.Sitemap = BRANCHER.map((b) => ({
    url: encodeURI(`${base}${b.slug}`),
    lastModified: SITE_UPDATED,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: SITE_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: encodeURI(`${base}/hør-mere`), lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/start`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/brancher`, lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    ...brancheUrls,
    { url: `${base}/handelsbetingelser`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privatliv`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/databehandleraftale`, lastModified: LEGAL_UPDATED, changeFrequency: "yearly", priority: 0.3 },
  ];
}
