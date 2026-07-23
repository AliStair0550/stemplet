import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Streamer eksporten i batches i stedet for at hente ALLE kortholdere i
// hukommelsen paa een gang. En butik med titusinder af kort ville ellers kunne
// sprænge en lambdas hukommelse/tidsgraense; nu holdes forbruget bundet uanset
// stOrrelse. Cursor paa (createdAt desc, id desc), saa raekkefOlgen er stabil.
const BATCH = 1000;

export async function GET() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return new Response("Ikke logget ind.", { status: 401 });

  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);

  const header = [
    "serial",
    "stempler",
    "fuldfoerte_kort",
    "email",
    "oprettet",
    "sidste_stempel",
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // UTF-8 BOM, saa Excel paa Windows viser ae/oe/aa korrekt.
      controller.enqueue(encoder.encode("﻿" + header.join(",") + "\n"));

      if (cardIds.length === 0) {
        controller.close();
        return;
      }

      let cursor: string | undefined;
      for (;;) {
        const batch = await prisma.customerCard.findMany({
          where: { cardId: { in: cardIds } },
          select: {
            id: true,
            serial: true,
            stamps: true,
            completedCount: true,
            contactEmail: true,
            createdAt: true,
            lastStampAt: true,
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: BATCH,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        if (batch.length === 0) break;

        const chunk = batch
          .map((c) =>
            [
              c.serial,
              c.stamps,
              c.completedCount,
              c.contactEmail ?? "",
              c.createdAt.toISOString(),
              c.lastStampAt?.toISOString() ?? "",
            ]
              .map(cell)
              .join(","),
          )
          .join("\n");
        controller.enqueue(encoder.encode(chunk + "\n"));

        if (batch.length < BATCH) break;
        cursor = batch[batch.length - 1].id;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="stemplet-kunder.csv"',
    },
  });
}
