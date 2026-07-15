-- Velkomststempel er nu FRA som standard for NYE butikker: strukturen er altid
-- den samme (1. kortet hentes, 2. stempler gives ved kassen). Aendrer kun
-- kolonnens default, ikke eksisterende butikkers valg (de kan selv slaa til/fra
-- i indstillinger).
ALTER TABLE "Business" ALTER COLUMN "welcomeStampEnabled" SET DEFAULT false;
