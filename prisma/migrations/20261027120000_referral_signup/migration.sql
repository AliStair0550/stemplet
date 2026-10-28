-- Henvisninger, fase 2: kundesiden. Rent additivt for Stemplet: et nyt nullable
-- felt paa Business, og phone (kun sat af henvisningsmodulet, altid NULL for
-- stempelkunder) bliver unik pr. butik, saa eet mobilnummer = eet kort.

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "bookingUrl" TEXT;

-- DropIndex
DROP INDEX "CustomerCard_businessId_phone_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCard_businessId_phone_key" ON "CustomerCard"("businessId", "phone");
