import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hent serienumre for pass, der er ændret siden sidst (til denne enhed).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ deviceLibraryId: string; passTypeId: string }> },
) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { deviceLibraryId } = await params;

  const regs = await prisma.walletRegistration.findMany({
    where: { deviceLibraryId },
    include: { customerCard: { select: { serial: true, lastStampAt: true } } },
  });

  if (regs.length === 0) return new Response(null, { status: 204 });

  return Response.json({
    lastUpdated: String(Date.now()),
    serialNumbers: regs.map((r) => r.customerCard.serial),
  });
}
