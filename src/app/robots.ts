import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://kort.folka.dk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Kun salgssider og juridiske sider. Dashboard, admin, kasse, kundernes
      // egne sider (kort, tilbud, henvisning, pushbesked-links), genfinding og
      // API skal ikke crawles.
      disallow: [
        "/app/",
        "/admin/",
        "/api/",
        "/kasse",
        "/k/",
        "/kort/",
        "/s/",
        "/fordele/",
        "/henvisninger/",
        "/pushbeskeder/",
        "/guide/",
        "/find-kort",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
