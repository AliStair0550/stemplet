-- Nye butikker starter med knappen "Tilbud og fordele" under kortet i Wallet.
-- Kun standardvaerdien aendres; eksisterende butikker roeres ikke.
ALTER TABLE "Business" ALTER COLUMN "cardActions" SET DEFAULT ARRAY['fordele']::TEXT[];
