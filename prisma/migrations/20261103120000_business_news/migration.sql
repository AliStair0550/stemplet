-- Beskeder: en kort nyhed fra butikken paa kundernes kort. Rent additivt.
ALTER TABLE "Business" ADD COLUMN "newsText" TEXT;
ALTER TABLE "Business" ADD COLUMN "newsSentAt" TIMESTAMP(3);
