-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'STAFF');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'OWNER';
