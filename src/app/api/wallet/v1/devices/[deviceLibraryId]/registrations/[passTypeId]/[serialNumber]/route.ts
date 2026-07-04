import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { loadCCForWallet, checkPassAuth } from "@/lib/wallet/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    deviceLibraryId: string;
    passTypeId: string;
    serialNumber: string;
  }>;
};

// Registrer en enhed til pass-opdateringer (Apple PassKit web service).
export async function POST(req: NextRequest, { params }: Params) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { deviceLibraryId, serialNumber } = await params;

  const cc = await loadCCForWallet(serialNumber);
  if (!cc || !checkPassAuth(req.headers.get("authorization"), cc.authToken)) {
    return new Response(null, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pushToken = String(body?.pushToken ?? "");
  if (!pushToken) return new Response(null, { status: 400 });

  const existing = await prisma.walletRegistration.findUnique({
    where: {
      customerCardId_deviceLibraryId: {
        customerCardId: cc.id,
        deviceLibraryId,
      },
    },
  });
  if (existing) {
    await prisma.walletRegistration.update({
      where: { id: existing.id },
      data: { pushToken },
    });
    return new Response(null, { status: 200 });
  }
  await prisma.walletRegistration.create({
    data: { customerCardId: cc.id, deviceLibraryId, pushToken },
  });
  return new Response(null, { status: 201 });
}

// Afregistrer enheden.
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { deviceLibraryId, serialNumber } = await params;

  const cc = await loadCCForWallet(serialNumber);
  if (!cc || !checkPassAuth(req.headers.get("authorization"), cc.authToken)) {
    return new Response(null, { status: 401 });
  }
  await prisma.walletRegistration.deleteMany({
    where: { customerCardId: cc.id, deviceLibraryId },
  });
  return new Response(null, { status: 200 });
}
