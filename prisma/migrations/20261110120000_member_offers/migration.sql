-- Butikkens egne tilbud og samarbejdspartnere til kortholdere. Ny tabel.
CREATE TABLE "MemberOffer" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "partnerName" TEXT,
    "link" TEXT,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberOffer_businessId_kind_idx" ON "MemberOffer"("businessId", "kind");

ALTER TABLE "MemberOffer" ADD CONSTRAINT "MemberOffer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
