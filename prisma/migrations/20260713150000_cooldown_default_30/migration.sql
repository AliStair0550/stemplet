-- Bedre standard-cooldown paa selvbetjening: 120 -> 30 min. Personale-scan har
-- altid nul cooldown, saa 30 min raekker til at bremse farming uden at genere
-- almindelige gentagne koeb. Butikker kan stadig selv aendre det i Indstillinger.
ALTER TABLE "Business" ALTER COLUMN "stampCooldownMin" SET DEFAULT 30;

-- Loeft eksisterende butikker der stadig staar paa den gamle standard (120).
-- Butikker der selv har valgt en anden vaerdi roeres ikke.
UPDATE "Business" SET "stampCooldownMin" = 30 WHERE "stampCooldownMin" = 120;
