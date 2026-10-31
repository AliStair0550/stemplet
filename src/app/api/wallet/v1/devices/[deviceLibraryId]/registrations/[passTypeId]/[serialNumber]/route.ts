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

const DEVICE_ID = /^[A-Za-z0-9]{1,128}$/;
const PUSH_TOKEN = /^[A-Za-z0-9]{32,200}$/;
const MAX_DEVICES_PER_CARD = 10;

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
  // Kun formater, Apple faktisk sender (hex-agtige id'er). Alt andet ville fylde
  // databasen, give falske "APNs er i stykker"-alarmer og aldrig blive ryddet op.
  if (!DEVICE_ID.test(deviceLibraryId) || !PUSH_TOKEN.test(pushToken)) {
    return new Response(null, { status: 400 });
  }

  const key = { customerCardId: cc.id, deviceLibraryId };
  const existing = await prisma.walletRegistration.findUnique({
    where: { customerCardId_deviceLibraryId: key },
    select: { id: true },
  });
  if (existing) {
    await prisma.walletRegistration.update({ where: { id: existing.id }, data: { pushToken } });
    return new Response(null, { status: 200 });
  }
  // Et kort ligger normalt paa en eller to enheder. Loftet stopper nogen, der
  // registrerer tusindvis af falske enheder paa deres eget kort.
  const count = await prisma.walletRegistration.count({ where: { customerCardId: cc.id } });
  if (count >= MAX_DEVICES_PER_CARD) return new Response(null, { status: 429 });
  try {
    await prisma.walletRegistration.create({ data: { ...key, pushToken } });
  } catch (e) {
    // Samtidig registrering af samme enhed (Apple proever igen): den anden vinder.
    if ((e as { code?: string }).code !== "P2002") throw e;
    await prisma.walletRegistration.updateMany({ where: key, data: { pushToken } });
    return new Response(null, { status: 200 });
  }
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
