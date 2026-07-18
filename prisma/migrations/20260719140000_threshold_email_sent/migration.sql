-- Adskil KENDSGERNING (taerskel krydset, fire-once) fra HANDLING (mailen leveret).
-- To nye sent-flag, saa en daglig sweep kan gensende varsler der fejlede paa grund
-- af et forbigaaende Resend-blip, uden at genaabne fire-once-racet. Idempotent.

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "cardholderWarnEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "reached100EmailSentAt" TIMESTAMP(3);
