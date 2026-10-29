-- Pushbeskeder: kunden kan slaa dem fra pr. kort. Rent additivt.
ALTER TABLE "CustomerCard" ADD COLUMN "newsOptOut" BOOLEAN NOT NULL DEFAULT false;
