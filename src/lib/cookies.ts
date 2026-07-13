import "server-only";
import { cookies } from "next/headers";
import { newDeviceId } from "./ids";

const DEVICE_ID_COOKIE = "stemplet_device";
const secure = process.env.NODE_ENV === "production";
const CARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 aar

export function cardCookieName(businessId: string) {
  return `stemplet_card_${businessId}`;
}

/** Cookie-indstillinger for kort-tokenet. Deles, saa route-handlers kan saette
 *  den direkte paa NextResponse (mest paalidelige maade). */
export function cardCookieOptions() {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: CARD_COOKIE_MAX_AGE,
  };
}

/** Enhedstoken (authToken) for kundens kort hos en bestemt virksomhed. */
export async function getCardToken(
  businessId: string,
): Promise<string | undefined> {
  const c = await cookies();
  return c.get(cardCookieName(businessId))?.value;
}

export async function setCardToken(
  businessId: string,
  token: string,
): Promise<void> {
  const c = await cookies();
  c.set(cardCookieName(businessId), token, cardCookieOptions());
}

/** Stabil enheds-id til PIN-låsning i kassemodus. Oprettes ved behov. */
export async function ensureDeviceId(): Promise<string> {
  const c = await cookies();
  const existing = c.get(DEVICE_ID_COOKIE)?.value;
  if (existing) return existing;
  const id = newDeviceId();
  c.set(DEVICE_ID_COOKIE, id, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function getDeviceId(): Promise<string> {
  const c = await cookies();
  return c.get(DEVICE_ID_COOKIE)?.value ?? "ukendt";
}
