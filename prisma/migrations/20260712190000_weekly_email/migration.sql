-- Praeference for den ugentlige statistik-mail (default til, med afmeld-link).
ALTER TABLE "Business" ADD COLUMN "weeklyEmailEnabled" BOOLEAN NOT NULL DEFAULT true;
