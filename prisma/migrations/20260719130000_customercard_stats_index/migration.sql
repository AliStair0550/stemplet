-- Statistik-indeks paa CustomerCard. getBusinessStats laver ~10 count/aggregate,
-- der alle scoper paa cardId og filtrerer paa createdAt, lastStampAt eller
-- lifetimeStamps. Med kun @@index([cardId]) scanner hver optaelling alle butikkens
-- kortholder-raekker. Disse sammensatte indeks lader hvert filter koere paa indeks
-- i stedet for fuld scan. IF NOT EXISTS for at vaere sikker mod tidligere db push.

CREATE INDEX IF NOT EXISTS "CustomerCard_cardId_createdAt_idx" ON "CustomerCard"("cardId", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerCard_cardId_lastStampAt_idx" ON "CustomerCard"("cardId", "lastStampAt");
CREATE INDEX IF NOT EXISTS "CustomerCard_cardId_lifetimeStamps_idx" ON "CustomerCard"("cardId", "lifetimeStamps");
