-- Plakaten: eget billede, gemte valg og hvornaar den sidst blev hentet.
ALTER TABLE "Business" ADD COLUMN "posterPhoto" TEXT;
ALTER TABLE "Business" ADD COLUMN "posterSettings" JSONB;
ALTER TABLE "Business" ADD COLUMN "posterMadeAt" TIMESTAMP(3);
