-- Prismodel / manuel fakturering (Billy). Rene additive kolonner: alle nullable
-- eller med default, saa ingen backfill og ingen risiko for eksisterende data.
-- Gammel kode ignorerer de nye kolonner, saa migrationen kan koeres foer deploy.
ALTER TABLE "Business"
  ADD COLUMN "cardholderWarnedAt" TIMESTAMP(3),
  ADD COLUMN "reached100At"       TIMESTAMP(3),
  ADD COLUMN "proApprovedAt"      TIMESTAMP(3),
  ADD COLUMN "proApprovedById"    TEXT,
  ADD COLUMN "proPriceKr"         INTEGER NOT NULL DEFAULT 99,
  ADD COLUMN "proPriceUntil"      TIMESTAMP(3),
  ADD COLUMN "lastInvoicedAt"     TIMESTAMP(3),
  ADD COLUMN "newSignupsPaused"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stopped"            BOOLEAN NOT NULL DEFAULT false;
