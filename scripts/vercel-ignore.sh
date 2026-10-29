#!/bin/sh
# Vercels "Ignored Build Step": exit 0 = spring buildet over, exit 1 = byg.
#
# Hver deployment gemmer sine egne funktioner, og en preview for hver push til
# hver gren fyldte Function Storage op (gratis-planen har 10 GB). Tests koerer
# alligevel paa GitHub for alle grene, saa vi bygger kun:
#  - produktion (main),
#  - testsiden (grenen henvisninger med sin egen database),
#  - commits med [preview] i beskeden, naar en gren skal kunne ses i browseren.

if [ "$VERCEL_ENV" = "production" ]; then
  exit 1
fi
if [ "$VERCEL_GIT_COMMIT_REF" = "henvisninger" ]; then
  exit 1
fi
case "$VERCEL_GIT_COMMIT_MESSAGE" in
  *"[preview]"*) exit 1 ;;
esac

echo "Springer preview over for ${VERCEL_GIT_COMMIT_REF:-ukendt gren} (skriv [preview] i commit-beskeden for at bygge)."
exit 0
