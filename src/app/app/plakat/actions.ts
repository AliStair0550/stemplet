"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parsePosterSettings } from "@/lib/materials";
import { processArtwork, ArtworkError } from "@/lib/card-artwork";

/** Gem plakatens valg, saa man ikke starter forfra naeste gang. */
export async function savePosterSettings(raw: unknown): Promise<{ ok: true }> {
  const { business } = await requireBusiness();
  await prisma.business.update({ where: { id: business.id }, data: { posterSettings: parsePosterSettings(raw) } });
  return { ok: true };
}

/** Eget billede til plakaten (data-URI) eller null = brug billedet fra Design. */
export async function setPosterPhoto(dataUri: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const { business } = await requireBusiness();
  let photo: string | null = null;
  if (dataUri) {
    try {
      photo = await processArtwork(dataUri);
    } catch (e) {
      return { ok: false, error: e instanceof ArtworkError ? e.message : "Billedet kunne ikke gemmes. Prøv et andet." };
    }
  }
  await prisma.business.update({ where: { id: business.id }, data: { posterPhoto: photo } });
  revalidatePath("/app/plakat");
  return { ok: true };
}
