-- Henvisninger, fase 1: datamodel (se docs/henvisninger.md, Datamodel).
-- Rent additivt: nye kolonner er nullable eller har en default, og ingen
-- eksisterende kolonne eller raekke aendrer betydning. Stempel-logikken er urort.

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('CREATED', 'VISITED', 'REWARDED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('LINK', 'CODE_ENTERED', 'MANUAL_AT_DESK');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('AMOUNT', 'STAMPS', 'SERVICE');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('AVAILABLE', 'REDEEMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "referralsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CustomerCard" ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredByCardId" TEXT;

-- Backfill: kortets butik (denormaliseret fra skabelonen), saa henvisningskoden
-- kan vaere unik pr. butik i databasen.
UPDATE "CustomerCard" cc
SET "businessId" = c."businessId"
FROM "Card" c
WHERE c."id" = cc."cardId" AND cc."businessId" IS NULL;

-- CreateTable
CREATE TABLE "ReferralRule" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "newCustomerRewardType" "RewardType" NOT NULL,
    "newCustomerRewardValue" TEXT NOT NULL,
    "referrerRewardType" "RewardType" NOT NULL,
    "referrerRewardValue" TEXT NOT NULL,
    "minPurchaseKr" INTEGER,
    "maxReferralsPerMonth" INTEGER,
    "rewardExpiryDays" INTEGER NOT NULL DEFAULT 180,
    "termsLine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "referrerCardId" TEXT NOT NULL,
    "referredCardId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'CREATED',
    "source" "ReferralSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "visitedByStaffUserId" TEXT,
    "visitedByStaffDeviceId" TEXT,
    "visitIdempotencyKey" TEXT,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "referralId" TEXT,
    "type" "RewardType" NOT NULL,
    "value" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralRule_businessId_key" ON "ReferralRule"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredCardId_key" ON "Referral"("referredCardId");

-- CreateIndex
CREATE INDEX "Referral_businessId_status_idx" ON "Referral"("businessId", "status");

-- CreateIndex
CREATE INDEX "Referral_referrerCardId_idx" ON "Referral"("referrerCardId");

-- CreateIndex
CREATE INDEX "Referral_referrerCardId_status_rewardedAt_idx" ON "Referral"("referrerCardId", "status", "rewardedAt");

-- CreateIndex
CREATE INDEX "Reward_cardId_status_idx" ON "Reward"("cardId", "status");

-- CreateIndex
CREATE INDEX "Reward_referralId_idx" ON "Reward"("referralId");

-- CreateIndex
CREATE INDEX "Reward_status_expiresAt_idx" ON "Reward"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerCard_referredByCardId_idx" ON "CustomerCard"("referredByCardId");

-- CreateIndex
CREATE INDEX "CustomerCard_businessId_phone_idx" ON "CustomerCard"("businessId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCard_businessId_referralCode_key" ON "CustomerCard"("businessId", "referralCode");

-- AddForeignKey
ALTER TABLE "CustomerCard" ADD CONSTRAINT "CustomerCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCard" ADD CONSTRAINT "CustomerCard_referredByCardId_fkey" FOREIGN KEY ("referredByCardId") REFERENCES "CustomerCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralRule" ADD CONSTRAINT "ReferralRule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerCardId_fkey" FOREIGN KEY ("referrerCardId") REFERENCES "CustomerCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredCardId_fkey" FOREIGN KEY ("referredCardId") REFERENCES "CustomerCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_visitedByStaffUserId_fkey" FOREIGN KEY ("visitedByStaffUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_visitedByStaffDeviceId_fkey" FOREIGN KEY ("visitedByStaffDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CustomerCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Vaern i databasen (ud over koden): ingen selvhenvisning paa samme kort, og
-- udloebsperioden skal vaere positiv.
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_not_self_check" CHECK ("referrerCardId" <> "referredCardId");
ALTER TABLE "ReferralRule" ADD CONSTRAINT "ReferralRule_expiry_positive_check" CHECK ("rewardExpiryDays" > 0);
