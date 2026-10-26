import type { NextRequest } from "next/server";
import { referralKasse, noAccess } from "@/lib/referral-kasse";
import { getDeskCustomer } from "@/lib/referral-desk";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kundens resultatkort: via kort-id (soegning) eller serial (scan af kortets QR).
export async function GET(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");
  const serial = sp.get("serial");
  if (!id && !serial) return apiError("BAD_REQUEST", "Mangler kunde.");
  const customer = await getDeskCustomer(
    kasse.businessId,
    id ? { cardId: id } : { serial: serial! },
  );
  if (!customer) return apiError("NOT_FOUND", "Kunden findes ikke i butikken.");
  return Response.json({ ok: true, customer });
}
