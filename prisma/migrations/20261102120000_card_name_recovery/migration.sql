-- Kortets korte navn (knappen "Hent dit X-kort") og links til at gendanne kortet
-- med e-mail. Kun additivt.
ALTER TABLE "Business" ADD COLUMN "cardName" TEXT;

CREATE TABLE "CardRecoveryToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerCardId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardRecoveryToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CardRecoveryToken_tokenHash_key" ON "CardRecoveryToken"("tokenHash");
CREATE INDEX "CardRecoveryToken_customerCardId_idx" ON "CardRecoveryToken"("customerCardId");

ALTER TABLE "CardRecoveryToken" ADD CONSTRAINT "CardRecoveryToken_customerCardId_fkey" FOREIGN KEY ("customerCardId") REFERENCES "CustomerCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
