import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return new Response("Ikke logget ind.", { status: 401 });

  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const ccs = await prisma.customerCard.findMany({
    where: { cardId: { in: cards.map((c) => c.id) } },
    select: {
      serial: true,
      stamps: true,
      completedCount: true,
      contactEmail: true,
      createdAt: true,
      lastStampAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "serial",
    "stempler",
    "fuldfoerte_kort",
    "email",
    "oprettet",
    "sidste_stempel",
  ];
  const rows = ccs.map((c) => [
    c.serial,
    c.stamps,
    c.completedCount,
    c.contactEmail ?? "",
    c.createdAt.toISOString(),
    c.lastStampAt?.toISOString() ?? "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map(cell).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="stemplet-kunder.csv"',
    },
  });
}
