import "server-only";
import { prisma } from "./prisma";

// Demo-butikken bag "Prøv det selv" paa forsiden. Slug'et er offentligt (staar i
// URL'er), saa det er fint som konstant. Kan overstyres med env, hvis demoen en
// dag skal pege paa en anden butik.
export const DEMO_SLUG = process.env.DEMO_SLUG || "demo-kaffebar";

/** Loader demo-butikken med dens aktive kort-skabelon (til branding + oprettelse). */
export function loadDemoBusiness() {
  return prisma.business.findUnique({
    where: { slug: DEMO_SLUG },
    include: {
      cards: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
}
