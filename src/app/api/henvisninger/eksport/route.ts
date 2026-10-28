import { getSessionBusinessId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { csvCell } from "@/lib/csv";
import { referralExportRows } from "@/lib/referral-desk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CSV-eksport (fx til butikkens eget kundesystem): alle kunder med en henvisningskode. Samme vaern som
// Stemplets eksport (csvCell mod formel-injektion, BOM til Excel). Kun ejerens
// login og kun naar henvisninger er slaaet til.
export async function GET() {
  const businessId = await getSessionBusinessId();
  if (!businessId) return new Response("Ikke logget ind.", { status: 401 });
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { referralsEnabled: true, slug: true },
  });
  if (!business?.referralsEnabled) return new Response("Ikke fundet.", { status: 404 });

  const rows = await referralExportRows(businessId);
  const header = ["navn", "email", "nyheder_samtykke", "mobil", "kode", "henvist_af", "henvisninger_gennemfoert", "beloenninger_til_gode", "oprettet"];
  const lines = rows.map((r) =>
    [
      csvCell(r.name),
      csvCell(r.email),
      // Tidspunkt for samtykke til nyhedsmail (tomt = intet samtykke).
      csvCell(r.consentAt ? r.consentAt.toISOString().slice(0, 10) : null),
      // Uden "+" (MSISDN, fx 4512345678): de fleste systemer tager formatet, og et
      // ledende "+" ville ellers blive neutraliseret til '+45... af csvCell.
      csvCell(r.phone ? r.phone.replace(/^\+/, "") : null),
      csvCell(r.code),
      csvCell(r.referredBy),
      csvCell(r.referralsDone),
      csvCell(r.rewardsAvailable),
      csvCell(r.createdAt.toISOString().slice(0, 10)),
    ].join(","),
  );
  const body = "﻿" + [header.join(","), ...lines].join("\n") + "\n";
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="henvisninger-${business.slug}.csv"`,
      "cache-control": "no-store",
    },
  });
}
