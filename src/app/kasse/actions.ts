"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pairDevice, clearKasseCookie } from "@/lib/kasse";
import { durableRateLimit } from "@/lib/rate-limit";

export async function pairDeviceAction(input: {
  code: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = await headers();
  const ip =
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "ukendt";
  // Bremse mod gaetteri af parringskoder.
  const ok = await durableRateLimit("device-pair", ip, 12, 600);
  if (!ok) {
    return { ok: false, error: "For mange forsøg. Prøv igen om lidt." };
  }
  return pairDevice(input.code, input.name);
}

export async function unpairAction(): Promise<void> {
  await clearKasseCookie();
  redirect("/kasse");
}
