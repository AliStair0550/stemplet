-- Kortet: butikkens faelles kortdesign paa tvaers af produkterne (stil, eget
-- billede og knapper paa kortet). Farver og logo ligger allerede paa Business.
-- Standardvaerdierne giver praecis det kort, butikkerne har i dag.
ALTER TABLE "Business" ADD COLUMN "cardStyle" TEXT NOT NULL DEFAULT 'color';
ALTER TABLE "Business" ADD COLUMN "cardArtwork" TEXT;
ALTER TABLE "Business" ADD COLUMN "cardActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
