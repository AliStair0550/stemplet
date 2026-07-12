-- DB-backet PIN-laasning, saa 3-forsoegs-laasningen aldrig kan omgaas ved et
-- Redis-nedbrud.
CREATE TABLE "PinAttempt" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "lockId" TEXT NOT NULL,
    "fails" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PinAttempt_businessId_lockId_key" ON "PinAttempt"("businessId", "lockId");
