import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Dashboard, kunde-kort, genfinding og API skal ikke indekseres.
      disallow: ["/app/", "/api/", "/k/", "/kort/", "/s/", "/guide/", "/find-kort"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
