import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

/** Er en (resolveret) IP loopback/privat/link-local? SSRF-vaern for webhooks. */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v.startsWith("fe80:") || v.startsWith("fc") || v.startsWith("fd")) {
    return true;
  }
  const v4 = v.startsWith("::ffff:") ? v.slice(7) : v;
  const m = v4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

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
    // SSRF-vaern mod DNS-rebinding: slaa vaerten op og afvis, hvis den peger
    // paa en intern/privat adresse (selv om hostnavnet saa uskyldigt ud).
    const target = new URL(business.webhookUrl);
    const { address } = await lookup(target.hostname);
    if (isPrivateAddress(address)) {
      console.error("Webhook blokeret (privat adresse):", target.hostname);
      return;
    }

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
