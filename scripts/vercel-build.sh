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

# Neon sover paa gratisplanen og kan svare "Can't reach database server" (P1001),
# mens den vaagner. Proev migrate deploy op til tre gange med pause, foer vi
# giver op. Migrationer er idempotente (allerede anvendte springes over).
migrate_with_retry() {
  for attempt in 1 2 3; do
    if prisma migrate deploy; then
      return 0
    fi
    if [ "$attempt" -lt 3 ]; then
      echo "migrate deploy fejlede (forsoeg $attempt af 3). Proever igen om 15 sek."
      sleep 15
    fi
  done
  return 1
}

prisma generate

if [ "$VERCEL_ENV" = "production" ]; then
  if [ -n "$DIRECT_URL" ]; then
    echo "Produktions-build: anvender skemamigrationer (prisma migrate deploy)"
    migrate_with_retry
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
  migrate_with_retry
  npx tsx scripts/preview-seed.ts
else
  echo "Ikke-produktions-build (${VERCEL_ENV:-lokal}): springer migrationer over."
fi

next build
