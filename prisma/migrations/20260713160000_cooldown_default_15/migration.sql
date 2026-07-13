-- Standard-cooldown paa selvbetjening: 15 min (var 30). Personale-scan har altid
-- nul cooldown, saa 15 min bremser farming uden at genere gentagne koeb.
ALTER TABLE "Business" ALTER COLUMN "stampCooldownMin" SET DEFAULT 15;

-- Loeft butikker der stadig staar paa en tidligere auto-standard (30 eller 120).
-- Butikker der selv har valgt en anden vaerdi roeres ikke.
UPDATE "Business" SET "stampCooldownMin" = 15 WHERE "stampCooldownMin" IN (30, 120);
