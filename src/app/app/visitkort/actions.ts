"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { visitkortSchema } from "@/lib/visitkort";
import { captureServerError } from "@/lib/sentry";

type Result = { ok: true } | { ok: false; error: string };

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
