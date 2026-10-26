-- Henvisninger, fase 3: indloesning af beloenninger ved kassen. Rent additivt:
-- nye nullable kolonner paa Reward (tabellen er ny fra fase 1). Stemplet uroert.

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "redeemIdempotencyKey" TEXT,
ADD COLUMN     "redeemedByStaffDeviceId" TEXT,
ADD COLUMN     "redeemedByStaffUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_redeemedByStaffUserId_fkey" FOREIGN KEY ("redeemedByStaffUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_redeemedByStaffDeviceId_fkey" FOREIGN KEY ("redeemedByStaffDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

