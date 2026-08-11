-- Personale-PIN er nu valgfri: standard ingen PIN ved indloesning (kan slaas til
-- i indstillinger). Gor kolonnen nullable. Eksisterende PIN'er bevares.
ALTER TABLE "Business" ALTER COLUMN "staffPin" DROP NOT NULL;
