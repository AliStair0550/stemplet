import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { getRedis } from "./redis";

// Stempel-tokens er signerede JWT'er, der udloeber efter 60 sekunder og kun
// kan bruges een gang. Brugte jti'er gemmes i Redis (TTL 10 min) => replay umuligt.

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

/**
 * Markerer et jti som brugt. Returnerer false hvis det allerede var brugt
 * (replay). Bruger SET NX med TTL, saa tjek + saet er atomisk.
 */
export async function consumeJti(jti: string): Promise<boolean> {
  const redis = getRedis();
  const res = await redis.set(`stampjti:${jti}`, "1", {
    nx: true,
    ex: JTI_TTL_SECONDS,
  });
  return res === "OK";
}
