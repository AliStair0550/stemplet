-- Hvornaar kortets Wallet-pass sidst blev aendret (saettes ved hvert push).
-- Enheden spoerger "hvad er aendret siden X" og faar nu kun de aendrede kort.
-- Eksisterende kort faar migrationstidspunktet, saa de hentes een gang endnu.
ALTER TABLE "CustomerCard" ADD COLUMN "passUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
