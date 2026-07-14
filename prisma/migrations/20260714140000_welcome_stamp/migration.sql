-- Velkomststempel ved kundens foerste scan (standard til).
ALTER TABLE "Business" ADD COLUMN "welcomeStampEnabled" BOOLEAN NOT NULL DEFAULT true;
