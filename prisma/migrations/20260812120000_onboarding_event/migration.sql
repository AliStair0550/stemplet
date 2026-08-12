-- CreateTable
CREATE TABLE "OnboardingEvent" (
    "id" TEXT NOT NULL,
    "anonId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingEvent_anonId_step_key" ON "OnboardingEvent"("anonId", "step");

-- CreateIndex
CREATE INDEX "OnboardingEvent_step_createdAt_idx" ON "OnboardingEvent"("step", "createdAt");
