"use server";

import { redirect } from "next/navigation";
import { loadCardBySerial } from "@/lib/stamp";
import { setCardToken } from "@/lib/cookies";

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
