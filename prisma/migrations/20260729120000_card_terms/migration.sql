-- Valgfri betingelser paa kortet (vises under "Hent mit stempelkort" for kunden).
-- Ren additiv, nullable kolonne: ingen backfill, ingen risiko for eksisterende data.
ALTER TABLE "Card" ADD COLUMN "terms" TEXT;
