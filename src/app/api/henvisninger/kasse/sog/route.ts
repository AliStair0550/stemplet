import type { NextRequest } from "next/server";
import { referralKasse, noAccess } from "@/lib/referral-kasse";
import { searchDeskCustomers } from "@/lib/referral-desk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kassens soegning: navn, mobil eller kode. Kun butikker med henvisninger.
export async function GET(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const hits = await searchDeskCustomers(kasse.businessId, q.slice(0, 60));
  return Response.json({ ok: true, hits });
}
