-- Nye kort starter lyse ("Sand"), saa butikken selv kan goere dem moerkere.
-- Kun standardvaerdien aendres; eksisterende butikker roeres ikke.
ALTER TABLE "Business" ALTER COLUMN "primaryColor" SET DEFAULT '#EFEBE3';
ALTER TABLE "Business" ALTER COLUMN "textColor" SET DEFAULT '#1E2633';
