"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { getStripe, proPriceId } from "@/lib/stripe";
import { APP_URL } from "@/lib/env";
import { hashPin } from "@/lib/security";
import { generateApiKey } from "@/lib/integrations";
import {
  cardDesignSchema,
  businessSettingsSchema,
  setPinSchema,
  campaignSchema,
} from "@/lib/validation";
import type { CardDesign } from "@/components/CardDesigner";

type Result = { ok: boolean; error?: string };

async function primaryCard(businessId: string) {
  return prisma.card.findFirst({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveCardDesign(design: CardDesign): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = cardDesignSchema.safeParse(design);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  }
  const card = await primaryCard(business.id);
  if (!card) return { ok: false, error: "Kort mangler." };

  await prisma.$transaction([
    prisma.business.update({
      where: { id: business.id },
      data: {
        primaryColor: parsed.data.primaryColor,
        textColor: parsed.data.textColor,
        logoUrl: parsed.data.logoUrl ?? null,
      },
    }),
    prisma.card.update({
      where: { id: card.id },
      data: {
        stampsRequired: parsed.data.stampsRequired,
        rewardText: parsed.data.rewardText,
        stampIcon: parsed.data.stampIcon,
      },
    }),
  ]);

  revalidatePath("/app/kort");
  revalidatePath("/app");
  return { ok: true };
}

export async function saveSettings(formData: FormData): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = businessSettingsSchema.safeParse({
    name: formData.get("name"),
    stampCooldownMin: formData.get("stampCooldownMin"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  }
  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: parsed.data.name,
      stampCooldownMin: parsed.data.stampCooldownMin,
    },
  });
  revalidatePath("/app/indstillinger");
  return { ok: true };
}

export async function setPin(formData: FormData): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = setPinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) {
    return { ok: false, error: "PIN skal være 4 til 6 cifre." };
  }
  const staffPin = await hashPin(parsed.data.pin);
  await prisma.business.update({
    where: { id: business.id },
    data: { staffPin },
  });
  revalidatePath("/app/indstillinger");
  return { ok: true };
}

/** Danner (eller fornyer) API-nøglen. Vises kun her - opbevar den sikkert. */
export async function generateApiKeyAction(): Promise<Result> {
  const { business } = await requireBusiness();
  await prisma.business.update({
    where: { id: business.id },
    data: { apiKey: generateApiKey() },
  });
  revalidatePath("/app/integrationer");
  return { ok: true };
}

/** Slaar API-adgang fra. Webhooks stopper ogsaa (de kraever en nøgle). */
export async function revokeApiKeyAction(): Promise<Result> {
  const { business } = await requireBusiness();
  await prisma.business.update({
    where: { id: business.id },
    data: { apiKey: null },
  });
  revalidatePath("/app/integrationer");
  return { ok: true };
}

export async function saveWebhookUrl(formData: FormData): Promise<Result> {
  const { business } = await requireBusiness();
  const raw = String(formData.get("webhookUrl") ?? "").trim();

  let webhookUrl: string | null = null;
  if (raw) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return { ok: false, error: "Ugyldig URL. Brug fx https://minbutik.dk/webhook" };
    }
    if (url.protocol !== "https:") {
      return { ok: false, error: "URL'en skal bruge https." };
    }
    webhookUrl = url.toString();
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { webhookUrl },
  });
  revalidatePath("/app/integrationer");
  return { ok: true };
}

export async function createCampaign(formData: FormData): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = campaignSchema.safeParse({
    type: formData.get("type"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek datoerne." };
  }
  const card = await primaryCard(business.id);
  if (!card) return { ok: false, error: "Kort mangler." };

  await prisma.campaign.create({
    data: {
      cardId: card.id,
      type: parsed.data.type,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
    },
  });
  revalidatePath("/app/kampagner");
  return { ok: true };
}

export async function deleteCampaign(id: string): Promise<Result> {
  const { business } = await requireBusiness();
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { card: true },
  });
  if (!campaign || campaign.card.businessId !== business.id) {
    return { ok: false, error: "Kampagnen findes ikke." };
  }
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/app/kampagner");
  return { ok: true };
}

export async function startCheckout() {
  const { business } = await requireBusiness();
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    redirect("/app/indstillinger?fejl=stripe");
  }
  const stripe = getStripe();

  let customerId = business.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: business.name,
      metadata: { businessId: business.id },
    });
    customerId = customer.id;
    await prisma.business.update({
      where: { id: business.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const sessionUrl = (
    await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${APP_URL}/app/indstillinger?betaling=ok`,
      cancel_url: `${APP_URL}/app/indstillinger`,
      metadata: { businessId: business.id },
      subscription_data: { metadata: { businessId: business.id } },
    })
  ).url;

  if (sessionUrl) redirect(sessionUrl);
}

export async function openPortal() {
  const { business } = await requireBusiness();
  if (!process.env.STRIPE_SECRET_KEY) redirect("/app/indstillinger?fejl=stripe");
  if (!business.stripeCustomerId) redirect("/app/indstillinger");
  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: business.stripeCustomerId,
    return_url: `${APP_URL}/app/indstillinger`,
  });
  redirect(portal.url);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
