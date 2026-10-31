-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerCardId_fkey";

-- AlterTable
ALTER TABLE "CustomerCard" ADD COLUMN     "lastUndoKey" TEXT;

-- AlterTable
ALTER TABLE "Redemption" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "referrerCardId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Stamp" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_businessId_kind_recipient_key" ON "EmailLog"("businessId", "kind", "recipient");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_customerCardId_idempotencyKey_key" ON "Redemption"("customerCardId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Stamp_customerCardId_idempotencyKey_key" ON "Stamp"("customerCardId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerCardId_fkey" FOREIGN KEY ("referrerCardId") REFERENCES "CustomerCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

