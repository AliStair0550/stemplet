-- Enheds-dedup af claim: gem enheds-id paa kortet + unik pr. (kort, enhed), saa
-- samme enhed ikke kan faa to kort. NULL-vaerdier er distinkte i Postgres, saa
-- eksisterende kort (deviceId = NULL) paavirkes ikke.
ALTER TABLE "CustomerCard" ADD COLUMN "deviceId" TEXT;
CREATE UNIQUE INDEX "CustomerCard_cardId_deviceId_key" ON "CustomerCard"("cardId", "deviceId");
