import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Butikkens kort (skabeloner), aeldste foerst. Deles pr. request (React cache):
 * Hjem slog dem foer op seks gange (statistik, puls, klar til belønning,
 * forhaandsvisning, historik) mod en pulje paa fem forbindelser.
 */
export const getBusinessCards = cache((businessId: string) =>
  prisma.card.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } }),
);
