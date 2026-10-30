-- Oeverst paa kortet: logo, navn eller begge. Standard "logo" svarer til i dag
-- (logoet, hvis der er et, ellers navnet). Additiv kolonne, ingen data roeres.
ALTER TABLE "Business" ADD COLUMN "cardHeader" TEXT NOT NULL DEFAULT 'logo';
