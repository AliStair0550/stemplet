import "server-only";
import { prisma } from "./prisma";

// Demo-butikken bag "Prøv det selv" paa forsiden. Slug'et er offentligt (staar i
// URL'er), saa det er fint som konstant. Kan overstyres med env, hvis demoen en
// dag skal pege paa en anden butik.
export const DEMO_SLUG = process.env.DEMO_SLUG || "demo-kaffebar";

/** Loader demo-butikken med dens aktive kort-skabelon (til branding + oprettelse). */
export async function loadDemoBusiness() {
  try {
    return await prisma.business.findUnique({
      where: { slug: DEMO_SLUG },
      include: {
        cards: {
          where: { active: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
  } catch {
    // Databasen kan kortvarigt vaere utilgaengelig (fx en Neon-blip, netop mens
    // /proev prerenderes ved build). Fald tilbage til null i stedet for at kaste,
    // saa siden viser sin "demoen er ikke tilgaengelig"-fallback og buildet ikke
    // faelder. Naar databasen er tilbage, henter ISR (revalidate) friske data.
    return null;
  }
}
