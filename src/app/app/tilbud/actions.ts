"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MAX_OFFERS_PER_KIND, endOfDay, offerInputSchema, type OfferInput } from "@/lib/member-offers";

type Result = { ok: true } | { ok: false; error: string };

/** Opret et tilbud eller en samarbejdspartner til kortholderne. */
export async function createOfferAction(input: OfferInput): Promise<Result & { id?: string }> {
  const { business } = await requireBusiness();
  const parsed = offerInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  const d = parsed.data;
  const count = await prisma.memberOffer.count({ where: { businessId: business.id, kind: d.kind } });
  if (count >= MAX_OFFERS_PER_KIND) {
    return { ok: false, error: `Du kan højst have ${MAX_OFFERS_PER_KIND}. Slet et gammelt først.` };
  }
  const created = await prisma.memberOffer.create({
    select: { id: true },
    data: {
      businessId: business.id,
      kind: d.kind,
      title: d.title,
      text: d.text ?? null,
      partnerName: d.kind === "PARTNER" ? (d.partnerName ?? null) : null,
      link: d.link ?? null,
      endsAt: endOfDay(d.endsOn),
    },
  });
  revalidatePath("/app/tilbud");
  return { ok: true, id: created.id };
}

/** Ret et tilbud eller en samarbejdspartner. */
export async function updateOfferAction(id: string, input: OfferInput): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = offerInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  const d = parsed.data;
  const res = await prisma.memberOffer.updateMany({
    where: { id, businessId: business.id, kind: d.kind },
    data: {
      title: d.title,
      text: d.text ?? null,
      partnerName: d.kind === "PARTNER" ? (d.partnerName ?? null) : null,
      link: d.link ?? null,
      endsAt: endOfDay(d.endsOn),
    },
  });
  if (res.count === 0) return { ok: false, error: "Tilbuddet findes ikke længere." };
  revalidatePath("/app/tilbud");
  return { ok: true };
}

/** Vis eller skjul et tilbud for kunderne (uden at slette det). */
export async function setOfferActiveAction(id: string, active: boolean): Promise<Result> {
  const { business } = await requireBusiness();
  const res = await prisma.memberOffer.updateMany({ where: { id, businessId: business.id }, data: { active } });
  if (res.count === 0) return { ok: false, error: "Tilbuddet findes ikke længere." };
  revalidatePath("/app/tilbud");
  return { ok: true };
}

export async function deleteOfferAction(id: string): Promise<Result> {
  const { business } = await requireBusiness();
  await prisma.memberOffer.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath("/app/tilbud");
  return { ok: true };
}
