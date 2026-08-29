-- Visitkort-design gemmes som JSON paa butikken (skabelon, farver, fonts,
-- hjoerner, kontaktfelter). Additivt og nullable, ingen data roeres.
ALTER TABLE "Business" ADD COLUMN "businessCardDesign" JSONB;
