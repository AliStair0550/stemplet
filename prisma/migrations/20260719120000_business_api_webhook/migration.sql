-- Drift-fix: apiKey og webhookUrl stod i schema.prisma, men blev aldrig oprettet
-- af en migration. Produktionen har dem via en tidligere db push, men et frisk
-- miljoe (ny preview-branch, CI, disaster recovery) fik dem ikke, og saa fejler
-- hvert stempel ("column Business.apiKey does not exist"). Denne migration bringer
-- migrationssporet i sync med skemaet. Idempotent, saa den er en no-op paa DB'er
-- der allerede har kolonnerne.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Business_apiKey_key" ON "Business"("apiKey");
