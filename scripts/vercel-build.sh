#!/bin/sh
# Vercel build-step. Anvender skemamigrationer automatisk, men kun sikkert:
#
#  - Kun paa produktion (VERCEL_ENV=production). Previews migrerer ALDRIG, saa en
#    feature-branch ikke kan aendre produktions-databasen. Undtagelse: en preview
#    med sin EGEN database (PREVIEW_DATABASE=1, kun sat for den branch).
#  - Kun hvis DIRECT_URL er sat (den direkte, ikke-poolede forbindelse Prisma
#    bruger til migrate). Mangler den, springer vi over MED en advarsel i stedet
#    for at braekke build'et. Migrationer skal saa koeres manuelt, indtil
#    DIRECT_URL er tilfoejet i Vercels miljoevariabler.
#  - Fejler en migration paa produktion, fejler build'et (set -e), og Vercel
#    promoverer ikke deployet. Fail-closed.
set -e

prisma generate

if [ "$VERCEL_ENV" = "production" ]; then
  if [ -n "$DIRECT_URL" ]; then
    echo "Produktions-build: anvender skemamigrationer (prisma migrate deploy)"
    prisma migrate deploy
  else
    echo "ADVARSEL: DIRECT_URL er ikke sat i Vercel. Springer migrate deploy over."
    echo "         Tilfoej DIRECT_URL (direkte, ikke-poolet Neon-URL) i Vercel for"
    echo "         at aktivere automatiske migrationer ved deploy."
  fi
elif [ "$VERCEL_ENV" = "preview" ] && [ "$PREVIEW_DATABASE" = "1" ]; then
  # Testversion med sin EGEN database (fx branchen henvisninger). Flaget og
  # database-URL'erne saettes KUN for den branch i Vercel, saa en preview der
  # deler produktionens database aldrig migrerer.
  echo "Preview med egen database: anvender migrationer og seed"
  # Vagt: stopper buildet, hvis databasen ligner produktion (andre butikker).
  npx tsx scripts/preview-seed.ts --guard
  prisma migrate deploy
  npx tsx scripts/preview-seed.ts
else
  echo "Ikke-produktions-build (${VERCEL_ENV:-lokal}): springer migrationer over."
fi

next build
