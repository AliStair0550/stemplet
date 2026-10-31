-- Ali 2026-10-31: Stripe fjernet (manuel faktura indtil videre), og gamle tabeller og felter, der ikke bruges, slettes.
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "stripeCustomerId";

-- AlterTable
ALTER TABLE "MarketingSignup" DROP COLUMN "unsubscribed";

-- AlterTable
ALTER TABLE "Stamp" DROP COLUMN "locationId";

-- DropTable
DROP TABLE "OnboardingEvent";

-- DropTable
DROP TABLE "SignupRequest";

