-- Velkomststempel er nu FRA som standard: strukturen er altid den samme
-- (1. kortet hentes, 2. stempler gives ved kassen). Aendrer default for nye
-- butikker OG nulstiller alle eksisterende (kun testdata paa nuvaerende tidspunkt),
-- saa hele platformen starter paa den samme, enkle model. Kan slaas til i
-- indstillinger.
ALTER TABLE "Business" ALTER COLUMN "welcomeStampEnabled" SET DEFAULT false;
UPDATE "Business" SET "welcomeStampEnabled" = false;
