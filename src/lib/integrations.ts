import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

// ── API-nøgler ────────────────────────────────────────────────────────
// Bruges som Bearer-token til det offentlige API OG som hemmelighed til at
// signere webhooks, saa modtageren kan verificere afsenderen.

export function generateApiKey(): string {
  return "stmp_" + randomBytes(24).toString("hex");
}

/** Slaar en virksomhed op ud fra "Authorization: Bearer <apiKey>". */
export async function businessByApiKey(
  authHeader: string | null,
): Promise<Business | null> {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const key = match[1].trim();
  if (!key.startsWith("stmp_") || key.length < 20) return null;
  return prisma.business.findUnique({ where: { apiKey: key } });
}

// ── Webhooks ──────────────────────────────────────────────────────────
// POST'es ved stempel, beloenning klar og indloesning. Signeres med HMAC-
// SHA256 (apiKey som hemmelighed), header: x-stemplet-signature.

type WebhookTarget = {
  id: string;
  webhookUrl: string | null;
  apiKey: string | null;
};

export async function fireWebhook(
  business: WebhookTarget,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!business.webhookUrl || !business.apiKey) return;
  try {
    const body = JSON.stringify({
      event,
      businessId: business.id,
      data,
      sentAt: new Date().toISOString(),
    });
    const signature = createHmac("sha256", business.apiKey)
      .update(body)
      .digest("hex");
    await fetch(business.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Stemplet-Webhook/1",
        "x-stemplet-event": event,
        "x-stemplet-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    // Webhooks maa aldrig blokere eller vaelte et stempel.
    console.error("Webhook fejlede", e);
  }
}
