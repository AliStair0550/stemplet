-- Ensret standard-primaryColor med koden (DEFAULT_PRIMARY = #2A1A10, Espresso).
-- #061C3D var en Folka-farve, der slap med ved en fejl. AENDRER kun DEFAULT for
-- NYE butikker uden en valgt farve; eksisterende raekker roeres IKKE (og ingen
-- har #061C3D i dag).
ALTER TABLE "Business" ALTER COLUMN "primaryColor" SET DEFAULT '#2A1A10';
