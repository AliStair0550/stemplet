-- Livstidstaeller paa kundekort + beriget stempel-transaktionslog (medarbejder,
-- butik, loebende livstid, fuldt-kort-flag). Fundament for milepaele, stamkunde-
-- status og win-back senere. Backfilder eksisterende historik, saa ingen starter
-- paa nul.

-- 1) Nye kolonner
ALTER TABLE "CustomerCard" ADD COLUMN "lifetimeStamps" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Stamp"
  ADD COLUMN "businessId" TEXT,
  ADD COLUMN "staffUserId" TEXT,
  ADD COLUMN "staffDeviceId" TEXT,
  ADD COLUMN "lifetimeAfter" INTEGER,
  ADD COLUMN "filledCard" BOOLEAN NOT NULL DEFAULT false;

-- 2) Backfill: livstid = sum(multiplier) pr. kort (hele historikken med)
UPDATE "CustomerCard" cc
  SET "lifetimeStamps" = COALESCE(
    (SELECT SUM(s."multiplier") FROM "Stamp" s WHERE s."customerCardId" = cc."id"),
    0
  );

-- 3) Backfill: butik paa hver transaktion (via card)
UPDATE "Stamp" s
  SET "businessId" = c."businessId"
  FROM "CustomerCard" cc, "Card" c
  WHERE cc."id" = s."customerCardId" AND c."id" = cc."cardId";

-- 4) Backfill: livstid EFTER hver transaktion (loebende sum pr. kort, tidsordnet)
UPDATE "Stamp" s
  SET "lifetimeAfter" = r."running"
  FROM (
    SELECT "id",
      SUM("multiplier") OVER (
        PARTITION BY "customerCardId" ORDER BY "createdAt", "id"
      ) AS "running"
    FROM "Stamp"
  ) r
  WHERE r."id" = s."id";

-- 5) Fremmednoegler (SetNull: bevar loggen selv om bruger/enhed fjernes)
ALTER TABLE "Stamp" ADD CONSTRAINT "Stamp_staffUserId_fkey"
  FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Stamp" ADD CONSTRAINT "Stamp_staffDeviceId_fkey"
  FOREIGN KEY ("staffDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6) Indeks til per-butik-analyser over tid
CREATE INDEX "Stamp_businessId_createdAt_idx" ON "Stamp"("businessId", "createdAt");
