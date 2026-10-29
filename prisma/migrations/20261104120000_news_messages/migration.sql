-- Pushbeskeder: historik over sendte beskeder. Rent additivt.
CREATE TABLE "NewsMessage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsMessage_businessId_sentAt_idx" ON "NewsMessage"("businessId", "sentAt");

ALTER TABLE "NewsMessage" ADD CONSTRAINT "NewsMessage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
