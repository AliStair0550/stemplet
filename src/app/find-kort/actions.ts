"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { durableRateLimit } from "@/lib/rate-limit";
import { requestCardRecovery } from "@/lib/card-recovery";
import { APP_URL } from "@/lib/env";

export type FindState = { error?: string; sentTo?: string };

/** "emma.holm@gmail.com" -> "em***@gmail.com" (nok til at kunden genkender den). */
function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

// Genfind et kort ud fra serienummeret (staar under stregkoden paa kortet).
// Serienummeret er IKKE hemmeligt (det staar i stregkoden), saa det giver ikke
// selv adgang til kortet: vi sender i stedet et gendannelseslink til kortets
// e-mail, og kun den, der kan aabne mailen, faar kortet paa sin telefon.
export async function findMyCard(_prev: FindState, formData: FormData): Promise<FindState> {
  const serial = String(formData.get("serial") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (serial.length < 6) {
    return { error: "Skriv serienummeret fra dit kort." };
  }

  // Throttle pr. IP, saa siden hverken er et enumerations-orakel eller kan
  // bruges til at sende mange mails. DB-backet (virker ogsaa hvis Redis er nede).
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
  if (!(await durableRateLimit("findcard-ip", ip, 15, 600))) {
    return { error: "For mange forsøg. Vent et par minutter, og prøv igen." };
  }

  const cc = await prisma.customerCard.findUnique({
    where: { serial },
    select: { contactEmail: true, card: { select: { business: { select: { slug: true } } } } },
  });
  if (!cc) {
    return { error: "Vi kunne ikke finde et kort med det nummer. Tjek tallet, eller spørg personalet." };
  }
  if (!cc.contactEmail) {
    return { error: "Kortet har ingen e-mail, så vi kan ikke sende det til dig. Spørg personalet, så hjælper de." };
  }

  await requestCardRecovery({ slug: cc.card.business.slug, email: cc.contactEmail, baseUrl: APP_URL });
  return { sentTo: maskEmail(cc.contactEmail) };
}
