import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { changedSince } from "@/lib/wallet/registrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hent serienumre for pass, der er ændret siden sidst (til denne enhed). Kort
// stakker paa samme passTypeIdentifier, saa uden filteret hentede enheden ALLE
// sine kort igen ved hvert push.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deviceLibraryId: string; passTypeId: string }> },
) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { deviceLibraryId } = await params;

  const regs = await prisma.walletRegistration.findMany({
    where: { deviceLibraryId },
    select: { customerCard: { select: { serial: true, passUpdatedAt: true } } },
  });

  const result = changedSince(
    regs.map((r) => r.customerCard),
    req.nextUrl.searchParams.get("passesUpdatedSince"),
  );
  if (!result) return new Response(null, { status: 204 });
  return Response.json(result);
}
