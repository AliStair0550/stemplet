-- B4: hvornaar et push sidst naaede alle kortets enheder. Eksisterende kort regnes
-- som afleveret (ellers ville den foerste cron sende til alle kort igen).
ALTER TABLE "CustomerCard" ADD COLUMN "passPushedAt" TIMESTAMP(3);
UPDATE "CustomerCard" SET "passPushedAt" = "passUpdatedAt";
