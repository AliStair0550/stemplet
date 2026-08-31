-- Oprettelsesanmodning fra en butik (virksomhed, oensket beloenning, kontakt).
-- Erstatter selvbetjent oprettelse: superadmin faar en mail og laver et udkast.
CREATE TABLE "SignupRequest" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "createdIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SignupRequest_createdAt_idx" ON "SignupRequest"("createdAt");
