import { getSuperadminEmail, isAdminUnlocked } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CSV-celle: pak ind i anfoerselstegn og fordoble evt. anfoerselstegn indeni.
function cell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// Kontaktliste som CSV til at skrive til opretterne. Samme gating som /admin:
// superadmin-email + kode-laas. Demo-butikken er ikke en kontakt og udelades.
export async function GET() {
  const admin = await getSuperadminEmail();
  if (!admin || !(await isAdminUnlocked())) {
    return new Response("Ikke fundet", { status: 404 });
  }

  const businesses = await prisma.business.findMany({
    where: { slug: { not: DEMO_SLUG } },
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { email: true, name: true, emailVerified: true } },
      cards: { select: { id: true } },
    },
  });

  const header = [
    "Butik",
    "Slug",
    "Plan",
    "Ejer-email",
    "Ejer-navn",
    "Verificeret",
    "Kunder",
    "Oprettet",
    "Vilkaar accepteret",
    "Branche",
    "Placering",
    "Stripe",
  ];

  const lines: string[] = [header.map(cell).join(",")];

  for (const b of businesses) {
    const customers = await prisma.customerCard.count({
      where: { cardId: { in: b.cards.map((c) => c.id) } },
    });
    // En raekke pr. ejer-email, saa hver kontakt staar for sig.
    const owners = b.users.length ? b.users : [null];
    for (const o of owners) {
      lines.push(
        [
          cell(b.name),
          cell(b.slug),
          cell(b.plan),
          cell(o?.email ?? ""),
          cell(o?.name ?? ""),
          cell(o ? (o.emailVerified ? "ja" : "nej") : ""),
          cell(customers),
          cell(b.createdAt.toISOString().slice(0, 10)),
          cell(b.termsAcceptedAt ? b.termsAcceptedAt.toISOString().slice(0, 10) : ""),
          cell(b.category ?? ""),
          cell(b.latitude != null && b.longitude != null ? "ja" : "nej"),
          cell(b.stripeCustomerId ? "ja" : "nej"),
        ].join(","),
      );
    }
  }

  // BOM foran, saa Excel laeser aeoeaa korrekt som UTF-8.
  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="stemplet-kontakter.csv"`,
      "cache-control": "no-store",
    },
  });
}
