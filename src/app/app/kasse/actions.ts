"use server";

import { requireBusiness } from "@/lib/session";
import {
  createPairingCode,
  revokeDevice,
  renameDevice,
} from "@/lib/kasse";

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

export async function renameDeviceAction(
  deviceId: string,
  name: string,
): Promise<void> {
  const { business } = await requireBusiness();
  await renameDevice(business.id, deviceId, name);
}
