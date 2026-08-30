"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { visitkortSchema } from "@/lib/visitkort-schema";
import { captureServerError } from "@/lib/sentry";

type Result = { ok: true } | { ok: false; error: string };

// Saetter (eller rydder) butikkens logo fra visitkort-designeren. Logoet er delt
// med kortet/Wallet, saa et upload her opdaterer brandets logo alle steder.
export async function setBusinessLogo(dataUrl: string | null): Promise<Result> {
  const { business } = await requireBusiness();
  if (dataUrl != null) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/") || dataUrl.length > 1_500_000) {
      return { ok: false, error: "Ugyldigt billede." };
    }
  }
  try {
    await prisma.business.update({
      where: { id: business.id },
      data: { logoUrl: dataUrl },
    });
  } catch (e) {
    captureServerError(e, { route: "visitkort:set-logo" });
    return { ok: false, error: "Kunne ikke gemme logoet. Prøv igen." };
  }
  revalidatePath("/app/visitkort");
  revalidatePath("/app/kort");
  return { ok: true };
}

export async function saveVisitkortDesign(input: unknown): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = visitkortSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Designet kunne ikke gemmes. Tjek felterne." };
  }
  try {
    await prisma.business.update({
      where: { id: business.id },
      data: { businessCardDesign: parsed.data },
    });
  } catch (e) {
    captureServerError(e, { route: "visitkort:save" });
    return { ok: false, error: "Kunne ikke gemme lige nu. Prøv igen." };
  }
  revalidatePath("/app/visitkort");
  return { ok: true };
}
