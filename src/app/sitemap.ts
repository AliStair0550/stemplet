import type { MetadataRoute } from "next";
import { BRANCHER } from "@/lib/brancher";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk";

// Kun offentlige, indekserbare sider. Dashboard, kunde-kort og API er udeladt.
export default function sitemap(): MetadataRoute.Sitemap {
  // Branchesider har danske slugs (aeoeaa); encodeURI giver korrekt
  // procent-encoded <loc> i sitemap-XML'en.
  const brancheUrls: MetadataRoute.Sitemap = BRANCHER.map((b) => ({
    url: encodeURI(`${base}${b.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/hvorfor`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/brancher`, changeFrequency: "monthly", priority: 0.7 },
    ...brancheUrls,
    { url: `${base}/start`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/handelsbetingelser`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${base}/privatliv`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/databehandleraftale`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
