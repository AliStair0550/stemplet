-- Henvisninger uden Stemplet: en butik kan have Stemplet slaaet fra (kun
-- Henvisninger). Standard er TIL, saa alle eksisterende butikker er uaendrede.
ALTER TABLE "Business" ADD COLUMN "stampsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Oprettelsesanmodningen kan vaelge stempelkortet fra (kun Henvisninger).
-- Standard er TIL, saa eksisterende anmodninger betyder det samme som foer.
ALTER TABLE "SignupRequest" ADD COLUMN "wantsStamps" BOOLEAN NOT NULL DEFAULT true;
