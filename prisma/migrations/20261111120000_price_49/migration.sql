-- Ny prismodel: tre maaneder gratis, derefter 49 kr./md. ekskl. moms.
-- Standardprisen aendres fra 99 til 49. Butikker paa den gamle standardpris (99)
-- flyttes til 49; individuelle specialpriser roeres ikke.
ALTER TABLE "Business" ALTER COLUMN "proPriceKr" SET DEFAULT 49;
UPDATE "Business" SET "proPriceKr" = 49 WHERE "proPriceKr" = 99;
