import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { getRedis } from "./redis";
import {
  STAMP_TOKEN_TTL_SECONDS,
  STAMP_JTI_TTL_SECONDS,
} from "./system-config";

// Stempel-tokens er signerede JWT'er, der udløber efter 60 sekunder. Et token
// maa bruges EEN gang PR. KORT (ikke globalt): tre kunder i en kø kan scanne
// samme skærm-QR inden for dens levetid og faa hver deres stempel, men det
// samme kort kan aldrig bruge samme token to gange. Brugte (jti, kort)-par
// gemmes i Redis (TTL 10 min) => replay umuligt.

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
    .setExpirationTime(`${STAMP_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
  return { token, jti, expiresInSeconds: STAMP_TOKEN_TTL_SECONDS };
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
 * Læser businessId fra et stempel-token, SELV hvis det er udløbet. Signaturen
 * tjekkes stadig (clockTolerance tolererer kun udløbet), saa en forfalsket token
 * afvises. Bruges UDELUKKENDE til at pege en strandet kunde (udløbet skærm-QR)
 * hen til deres eget kort, ALDRIG til at give et stempel. Returnerer null ved en
 * ugyldig/uforstaaelig token.
 */
export async function readStampBusinessIdAllowExpired(
  token: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      // Ét aar: accepter udløbet token til navigation (ikke til stempling).
      clockTolerance: 60 * 60 * 24 * 365,
    });
    return payload.businessId ? String(payload.businessId) : null;
  } catch {
    return null;
  }
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
    ex: STAMP_JTI_TTL_SECONDS,
  });
  return res === "OK";
}

// ── Afmeld-token (ugebrev) ───────────────────────────────────────────
// Signeret, uden udloeb, saa afmeld-linket i mails virker for altid.

export async function signUnsubscribeToken(businessId: string): Promise<string> {
  return new SignJWT({ businessId, purpose: "unsub" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secretKey());
}

export async function verifyUnsubscribeToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: ["HS256"],
  });
  if (payload.purpose !== "unsub" || !payload.businessId) {
    throw new Error("Ugyldigt afmeld-token");
  }
  return String(payload.businessId);
}
