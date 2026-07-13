-- Tids-indekser til statistik og ugebrev-cron: alle tids-vinduer og
-- "seneste aktivitet" bliver rene index-scans i stedet for filter-derefter-sort.
CREATE INDEX "Stamp_customerCardId_createdAt_idx" ON "Stamp"("customerCardId", "createdAt");
CREATE INDEX "Redemption_customerCardId_createdAt_idx" ON "Redemption"("customerCardId", "createdAt");
CREATE INDEX "AuditLog_businessId_createdAt_idx" ON "AuditLog"("businessId", "createdAt");
