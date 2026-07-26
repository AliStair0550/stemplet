-- "Hold mig orienteret"-tilmelding med dobbelt opt-in. Ren additiv tabel + enum,
-- ingen aendring af eksisterende data, saa migrationen kan koeres foer deploy.

-- CreateEnum
CREATE TYPE "MarketingStatus" AS ENUM ('NEW', 'CONTACTED', 'NOT_RELEVANT');

-- CreateTable
CREATE TABLE "MarketingSignup" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "storeName" TEXT,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "MarketingStatus" NOT NULL DEFAULT 'NEW',
    "note" TEXT,
    "signedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmIp" TEXT,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingSignup_email_key" ON "MarketingSignup"("email");

-- CreateIndex
CREATE INDEX "MarketingSignup_signedUpAt_idx" ON "MarketingSignup"("signedUpAt");

-- CreateIndex
CREATE INDEX "MarketingSignup_confirmedAt_idx" ON "MarketingSignup"("confirmedAt");

-- CreateIndex
CREATE INDEX "MarketingSignup_source_idx" ON "MarketingSignup"("source");
