-- Apple poller enheds-endpointet (GET .../devices/:deviceLibraryId/registrations/...)
-- pr. enhed og filtrerer paa deviceLibraryId ALENE. Det sammensatte unique-indeks
-- har customerCardId som foerste kolonne, saa det opslag faldt tilbage til fuld
-- scan. Dette indeks gOr det til et indeksopslag, uanset hvor mange registreringer
-- der er. deviceLibraryId aendres aldrig efter oprettelse, saa indekset koster kun
-- ved registrer/afregistrer (sjaeldent), ikke ved stempling.
-- IF NOT EXISTS for at vaere sikker mod tidligere db push.

CREATE INDEX IF NOT EXISTS "WalletRegistration_deviceLibraryId_idx" ON "WalletRegistration"("deviceLibraryId");
