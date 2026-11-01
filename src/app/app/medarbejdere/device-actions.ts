"use server";

import { requireBusiness } from "@/lib/session";
import { createPairingCode, revokeDevice } from "@/lib/kasse";

export async function createPairingCodeAction(): Promise<{
  code: string;
  qrDataUrl: string;
  url: string;
}> {
  const { business } = await requireBusiness();
  return createPairingCode(business.id);
}

export async function revokeDeviceAction(deviceId: string): Promise<void> {
  const { business } = await requireBusiness();
  await revokeDevice(business.id, deviceId);
}
