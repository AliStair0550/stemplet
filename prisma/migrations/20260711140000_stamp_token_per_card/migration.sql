-- Token engangs PR. KORT i stedet for globalt.
-- En kø af forskellige kort kan dele samme skærm-QR inden for dens 60-sekunders
-- levetid; samme kort kan aldrig bruge samme token to gange. NULL-jti'er
-- (personale-scan / API-stempler) regnes som distinkte i Postgres og kolliderer
-- derfor aldrig.

DROP INDEX "Stamp_tokenJti_key";

CREATE UNIQUE INDEX "Stamp_tokenJti_customerCardId_key" ON "Stamp"("tokenJti", "customerCardId");
