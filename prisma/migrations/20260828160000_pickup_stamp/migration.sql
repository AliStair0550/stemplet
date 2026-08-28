-- Ny kampagnetype: stempel ved afhentning (kunden faar 1 stempel naar kortet
-- hentes i perioden). Additiv enum-vaerdi, ingen data roeres.
ALTER TYPE "CampaignType" ADD VALUE 'PICKUP_STAMP';
