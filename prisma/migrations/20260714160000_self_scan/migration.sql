-- Selvbetjening (kunde-selv-scanning) pr. butik. Standard FRA: kun personalet
-- scanner kundens kort.
ALTER TABLE "Business" ADD COLUMN "selfScanEnabled" BOOLEAN NOT NULL DEFAULT false;
