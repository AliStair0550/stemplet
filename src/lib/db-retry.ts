import "server-only";

// Neon (serverless Postgres) skalerer computen til nul efter inaktivitet. Den
// FOERSTE forbindelse efter dvale vaekker den, og den kan naa at time'e ud eller
// give "Can't reach database server" (P1001), foer den er varm. Et hurtigt retry
// rammer saa den nu-vaagne compute og lykkes. Vi retrier KUN forbigaaende
// forbindelsesfejl, aldrig aegte fejl (unik-konflikt, validering osv.).

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isTransientDbError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const code = (e as { code?: string }).code;
  if (code && RETRYABLE_CODES.has(code)) return true;
  // Init-fejl (kunne slet ikke oprette forbindelse) uden kode.
  if ((e as { name?: string }).name === "PrismaClientInitializationError") {
    return true;
  }
  const msg = (e as { message?: string }).message ?? "";
  return /can't reach database server|server has closed the connection|connection.*(closed|reset)|timed out/i.test(
    msg,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Koerer en DB-operation med korte retries paa forbigaaende forbindelsesfejl
 * (fx Neon cold start). Backoff: 250 ms, 500 ms. Alt andet end forbigaaende
 * forbindelsesfejl kastes med det samme, saa aegte fejl ikke skjules.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries || !isTransientDbError(e)) throw e;
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastErr;
}
