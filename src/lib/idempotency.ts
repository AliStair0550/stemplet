import "server-only";
import { getRedis, redisConfigured } from "./redis";

// Idempotens for handlinger der IKKE maa ske to gange, hvis klienten proever igen
// efter et tabt svar (fx personalet giver et stempel paa daarligt wifi: svaret
// naar aldrig frem, de trykker igen). Uden dette faar kunden et ekstra stempel.
//
// Redis-baseret, ingen migration. Fail-open: uden noegle eller uden Redis koeres
// handlingen bare - idempotens er ekstra beskyttelse, aldrig en blocker for at
// kunne stemple.

const TTL_SECONDS = 600; // 10 min: rigeligt til et retry, kort nok til ingen ophobning.

/** Kastes naar en identisk handling stadig er i gang et andet sted (samtidigt
 *  forsoeg). Kalderen boer bede om at proeve igen om lidt - IKKE koere handlingen. */
export class IdempotencyInFlight extends Error {
  constructor() {
    super("En identisk handling behandles allerede.");
    this.name = "IdempotencyInFlight";
  }
}

type Stored<T> = { done: false } | { done: true; result: T };

// Minimalt Redis-interface, saa runOnce kan testes med en fake (samme moenster
// som consumeJti). set med NX+TTL claimer atomisk; get/del laeser og frigiver.
type IdemStore = {
  set: (
    key: string,
    value: unknown,
    opts: { nx?: boolean; ex: number },
  ) => Promise<unknown>;
  get: (key: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
};

/**
 * Koer `run` hoejst een gang for en given noegle. Kaldes den igen med samme
 * noegle (retry), returneres FOERSTE resultat i stedet for at koere igen.
 */
export async function runOnce<T>(
  key: string | undefined,
  run: () => Promise<T>,
  store?: IdemStore,
): Promise<T> {
  const redis =
    store ?? (redisConfigured() ? (getRedis() as unknown as IdemStore) : null);
  if (!key || !redis) return run();
  const rkey = `idem:${key}`;

  let claimed: unknown = null;
  try {
    // Claim noeglen atomisk. NX = kun hvis den ikke findes. Returnerer "OK" hvis
    // vi vandt, ellers null.
    claimed = await redis.set(rkey, { done: false }, { nx: true, ex: TTL_SECONDS });
  } catch {
    // Redis-hikke: koer alligevel (acceptér den lille dobbelt-risiko frem for at
    // blokere en legitim stempling).
    return run();
  }

  if (claimed !== "OK") {
    // Noeglen findes: enten et faerdigt resultat (retry efter tabt svar) eller en
    // samtidig handling der stadig koerer.
    let existing: Stored<T> | null = null;
    try {
      existing = (await redis.get(rkey)) as Stored<T> | null;
    } catch {
      throw new IdempotencyInFlight();
    }
    if (existing && existing.done) return existing.result;
    // Stadig i gang et andet sted: koer IKKE igen (undgaa dobbelt), bed om retry.
    throw new IdempotencyInFlight();
  }

  try {
    const result = await run();
    try {
      await redis.set(rkey, { done: true, result }, { ex: TTL_SECONDS });
    } catch {
      // Kunne ikke gemme resultatet: ikke kritisk (et retry ville saa koere igen).
    }
    return result;
  } catch (e) {
    // `run` fejlede (fx StampError): frigiv noeglen, saa et aegte nyt forsoeg ikke
    // blokeres af "processing"-markeringen.
    try {
      await redis.del(rkey);
    } catch {
      // ignorer
    }
    throw e;
  }
}
