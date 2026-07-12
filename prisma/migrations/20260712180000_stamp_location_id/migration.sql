-- Fremtidssikring: nullable locationId paa Stamp, saa per-butik statistik kan
-- bygges senere uden blind historik. Ingen Location-tabel, ingen logik endnu.
ALTER TABLE "Stamp" ADD COLUMN "locationId" TEXT;
