-- Kunden skriver nu navn og e-mail, naar kortet hentes, saa standardteksten
-- "Ingen tilmelding" paa visitkortets bagside er ikke laengere sand. Kun den
-- uaendrede standardtekst opdateres; egne tekster roeres ikke.
UPDATE "Business"
SET "businessCardDesign" = jsonb_set("businessCardDesign"::jsonb, '{backLine2}', '"Ingen app. Kun navn og e-mail."')
WHERE "businessCardDesign" IS NOT NULL
  AND "businessCardDesign"->>'backLine2' = 'Ingen app. Ingen tilmelding.';
