-- AlterTable: logo-stoerrelse paa kortet (1 = standard)
ALTER TABLE "Business" ADD COLUMN "logoScale" DOUBLE PRECISION NOT NULL DEFAULT 1;
