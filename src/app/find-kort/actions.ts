"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { loadCardBySerial } from "@/lib/stamp";
import { setCardToken } from "@/lib/cookies";
import { durableRateLimit } from "@/lib/rate-limit";

export type FindState = { error?: string };

// Genfind et eksisterende kort ud fra serienummeret (staar under stregkoden paa
// kortet). Saetter enheds-cookien igen, saa den nye telefon genkendes, og
// sender kunden hen til kortet. Serienummeret er globalt unikt, saa der er
// ingen tvivl om hvilken butik kortet hoerer til.
export async function findMyCard(
  _prev: FindState,
  formData: FormData,
): Promise<FindState> {
  const serial = String(formData.get("serial") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (serial.length < 6) {
    return { error: "Skriv serienummeret fra dit kort." };
  }

  // Throttle pr. IP: serienummeret binder et kort til en enhed, saa uden en
  // graense ville endpointet vaere baade et enumerations-orakel og en vej til
  // at proeve mange numre. DB-backet (virker ogsaa hvis Redis er nede).
  const h = await headers();
  const ip =
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "ukendt";
  if (!(await durableRateLimit("findcard-ip", ip, 15, 600))) {
    return {
      error: "For mange forsøg. Vent et par minutter, og prøv igen.",
    };
  }

  const cc = await loadCardBySerial(serial);
  if (!cc) {
    return {
      error:
        "Vi kunne ikke finde et kort med det nummer. Tjek tallet, eller spørg personalet.",
    };
  }

  await setCardToken(cc.card.businessId, cc.authToken);
  redirect(`/kort/${cc.serial}`);
}
