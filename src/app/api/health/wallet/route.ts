import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { buildPass } from "@/lib/wallet/pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MIDLERTIDIGT: beskyttet health-check der faar PRODUKTIONEN selv til at signere
// et test-pass med Vercels env, saa en evt. indsaetnings-fejl fanges foer den
// manuelle telefon-test. Beskyttet med CRON_SECRET. Fjernes efter verifikation.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!WALLET_ENABLED) {
    return Response.json({ walletEnabled: false, signed: false });
  }

  try {
    const buf = await buildPass({
      serial: "HEALTHCHECK01",
      authToken: "healthcheck-token-0123456789",
      businessName: "Healthcheck",
      primaryColor: "#2A1A10",
      textColor: "#F6EEE4",
      logoUrl: null,
      rewardText: "test",
      stamps: 1,
      required: 10,
      showPoweredBy: false,
    });
    return Response.json({ walletEnabled: true, signed: true, bytes: buf.length });
  } catch (e) {
    return Response.json(
      {
        walletEnabled: true,
        signed: false,
        error: String(e instanceof Error ? e.message : e).slice(0, 300),
      },
      { status: 500 },
    );
  }
}
