-- Henvisninger fase 5: oprettelsesanmodningen kan vaelge Henvisninger oven i
-- stempelkortet og beskrive de oenskede beloenninger. Kun nye kolonner med
-- standardvaerdi, saa eksisterende anmodninger er uaendrede.
ALTER TABLE "SignupRequest" ADD COLUMN "wantsReferrals" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SignupRequest" ADD COLUMN "referralReward" TEXT;
