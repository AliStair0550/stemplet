import "server-only";
import { PrismaClient } from "@prisma/client";

// Prisma-singleton. Undgår mange klienter under hot reload i dev.
// Neons pooler (pgbouncer) taaler mange klientforbindelser, men URL'en har
// connection_limit=1, saa hvert Promise.all koerte i koe paa een forbindelse.
// Vi saetter puljen her i stedet for at roere hemmeligheden i Vercel.
const POOL_SIZE = process.env.DB_POOL_SIZE ?? "5";

function pooledUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.searchParams.get("pgbouncer") !== "true") return raw;
    url.searchParams.set("connection_limit", POOL_SIZE);
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "10");
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: pooledUrl(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
