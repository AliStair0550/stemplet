-- Butikkens placering (valgfri). Bruges til Wallet-passets "location", saa
-- kortet dukker op paa kundens laaseskaerm i naerheden af butikken.
ALTER TABLE "Business" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Business" ADD COLUMN "longitude" DOUBLE PRECISION;
