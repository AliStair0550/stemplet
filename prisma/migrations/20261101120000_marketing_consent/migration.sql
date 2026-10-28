-- Kontaktdata ved kort: samtykke til nyhedsmail og een e-mail pr. kort pr. butik.
-- Kun additivt. contactEmail er hidtil aldrig skrevet, saa indekset kan ikke ramme dubletter.
ALTER TABLE "CustomerCard" ADD COLUMN "marketingConsentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CustomerCard_businessId_contactEmail_key" ON "CustomerCard"("businessId", "contactEmail");
