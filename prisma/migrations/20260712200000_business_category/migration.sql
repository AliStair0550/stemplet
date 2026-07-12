-- Branche pr. butik (nullable, saa eksisterende butikker kan backfilles i
-- indstillinger). Bruges senere til benchmarking og branche-tilpassede raad.
ALTER TABLE "Business" ADD COLUMN "category" TEXT;
