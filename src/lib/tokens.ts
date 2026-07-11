import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { getRedis } from "./redis";

// Stempel-tokens er signerede JWT'er, der udløber efter 60 sekunder. Et token
// maa bruges EEN gang PR. KORT (ikke globalt): tre kunder i en kø kan scanne
// samme skærm-QR inden for dens levetid og faa hver deres stempel, men det
// samme kort kan aldrig bruge samme token to gange. Brugte (jti, kort)-par
// gemmes i Redis (TTL 10 min) => replay umuligt.

const STAMP_TTL_SECONDS = 60;
const JTI_TTL_SECONDS = 10 * 60;

function secretKey(): Uint8Array {
  const s = process.env.STAMP_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (!s) {
    throw new Error("STAMP_TOKEN_SECRET (eller AUTH_SECRET) mangler.");
  }
  return new TextEncoder().encode(s);
}

export type StampTokenPayload = {
  businessId: string;
  cardId: string;
  jti: string;
};

export async function signStampToken(input: {
  businessId: string;
  cardId: string;
}): Promise<{ token: string; jti: string; expiresInSeconds: number }> {
  const jti = randomUUID();
  const token = await new SignJWT({
    businessId: input.businessId,
    cardId: input.cardId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${STAMP_TTL_SECONDS}s`)
    .sign(secretKey());
  return { token, jti, expiresInSeconds: STAMP_TTL_SECONDS };
}

export async function verifyStampToken(
  token: string,
): Promise<StampTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: ["HS256"],
  });
  if (!payload.businessId || !payload.cardId || !payload.jti) {
    throw new Error("Ugyldig token-payload");
  }
  return {
    businessId: String(payload.businessId),
    cardId: String(payload.cardId),
    jti: String(payload.jti),
  };
}

/** Redis-noeglen for et forbrugt token: unik pr. (token, kort). */
export function jtiKey(jti: string, customerCardId: string): string {
  return `stamp:${jti}:${customerCardId}`;
}

// Minimalt Redis-interface, saa consumeJti kan testes med en fake.
type NxSetter = {
  set: (
    key: string,
    value: string,
    opts: { nx: true; ex: number },
  ) => Promise<unknown>;
};

/**
 * Markerer et token som brugt AF ET BESTEMT KORT. Returnerer false, hvis netop
 * dette kort allerede har brugt tokenet (replay). Forskellige kort kan bruge
 * samme token inden for dets levetid. SET NX + TTL gør tjek + sæt atomisk.
 */
export async function consumeJti(
  jti: string,
  customerCardId: string,
  store?: NxSetter,
): Promise<boolean> {
  const redis = store ?? (getRedis() as unknown as NxSetter);
  const res = await redis.set(jtiKey(jti, customerCardId), "1", {
    nx: true,
    ex: JTI_TTL_SECONDS,
  });
  return res === "OK";
}
