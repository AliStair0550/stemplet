import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk";

// Kun offentlige, indekserbare sider. Dashboard, kunde-kort og API er udeladt.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
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
