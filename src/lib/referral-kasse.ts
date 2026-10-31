import "server-only";
import { after } from "next/server";
import { WALLET_ENABLED } from "./env";
import { prisma } from "./prisma";
import { kasseAccess } from "./kasse";
import { ensureDeviceId } from "./cookies";
import { apiError } from "./http";
import { ReferralError } from "./referral";
import { captureWalletError } from "./sentry";
import { verifyPin, recordPinFail, clearPinFails, pinLockRemaining } from "./security";

// Faelles for henvisningernes kasse-ruter (fase 3). Adgang er Stemplets egen
// kasseAccess (ejer-login eller parret enhed), uaendret, plus at butikken har
// henvisninger slaaet til. Uden modulet svarer ruterne 404, som om de ikke fandtes.

export type ReferralKasse = {
  businessId: string;
  staffUserId: string | null;
  staffDeviceId: string | null;
  staffPin: string | null;
};

export async function referralKasse(): Promise<ReferralKasse | null> {
  const access = await kasseAccess(true);
  if (!access) return null;
  const business = await prisma.business.findUnique({
    where: { id: access.businessId },
    select: { referralsEnabled: true, staffPin: true },
  });
  if (!business?.referralsEnabled) return null;
  return {
    businessId: access.businessId,
    staffUserId: access.source === "owner" ? (access.userId ?? null) : null,
    staffDeviceId: access.source === "device" ? (access.deviceId ?? null) : null,
    staffPin: business.staffPin,
  };
}

/**
 * Opdatér kundernes Wallet-kort efter en henvisning eller indloesning (fase 4).
 * Koeres EFTER svaret (next/server after), saa kassen ikke venter paa Apple, og
 * holder funktionen i live til pushet er sendt, ligesom Stemplets stempling.
 */
export function pushReferralWallet(cardIds: string[]): void {
  if (!WALLET_ENABLED || cardIds.length === 0) return;
  const unique = [...new Set(cardIds)];
  const run = async () => {
    try {
      const { pushWalletUpdate } = await import("./wallet/apns");
      await Promise.all(unique.map((id) => pushWalletUpdate(id)));
    } catch (e) {
      console.error("Wallet-push efter henvisning fejlede", e);
      captureWalletError(e, { operation: "apns:referral" });
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

export function noAccess() {
  return apiError("NOT_FOUND", "Henvisninger er ikke slået til.", 404);
}

/** ReferralError -> roligt svar til kassen med kode og besked. */
export function referralErrorResponse(e: ReferralError) {
  return apiError(e.code, e.message);
}

/**
 * Personale-PIN ved indloesning, samme regel som Stemplet: kraeves KUN, hvis
 * butikken har sat en. 5 forkerte forsoeg laaser i 5 minutter (Stemplets egen
 * laas, delt pr. butik og IP/enhed). Returnerer et fejlsvar, eller null = ok.
 */
export async function checkStaffPin(
  kasse: ReferralKasse,
  pin: string | undefined,
  ip: string | null,
  detail: Record<string, string>,
): Promise<Response | null> {
  if (!kasse.staffPin) return null;
  const lockId = ip ?? (await ensureDeviceId());
  let locked = 0;
  try {
    locked = await pinLockRemaining(kasse.businessId, lockId);
  } catch (e) {
    console.error("PIN-laas-opslag fejlede:", e);
  }
  if (locked > 0) {
    return apiError(
      "LOCKED",
      `For mange forkerte forsøg. Prøv igen om ${Math.ceil(locked / 60)} min.`,
    );
  }
  if (!pin) return apiError("PIN", "Indtast personale-PIN.");
  if (!(await verifyPin(pin, kasse.staffPin))) {
    let failLocked = false;
    try {
      failLocked = (await recordPinFail(kasse.businessId, lockId)).locked;
    } catch (e) {
      console.error("PIN-fejl-optaelling fejlede:", e);
    }
    await prisma.auditLog.create({
      data: {
        businessId: kasse.businessId,
        action: "PIN_FAIL",
        ip,
        detail: { ...detail, locked: failLocked },
      },
    });
    return apiError(
      "PIN",
      failLocked ? "Indløsning låst i 5 minutter." : "Forkert PIN. Prøv igen.",
    );
  }
  try {
    await clearPinFails(kasse.businessId, lockId);
  } catch {
    // ignorer: laasningen er ekstra beskyttelse, ikke kritisk
  }
  return null;
}
