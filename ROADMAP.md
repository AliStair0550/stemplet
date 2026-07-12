# Roadmap og produktbeslutninger

Kort log over bevidste beslutninger, så de ikke går tabt.

## Lokations-model (flere butikker under samme forretning)

**Status:** Planlagt til Q1 2027. Bygges IKKE nu.

**Beslutning:** Bygges først, når den første rigtige kæde-kunde efterspørger den,
og da som en del af en **Max-plan** (ikke Pro).

**Model, når den bygges:** Én konto = ét brand og ét fælles stempelkort, med
flere **lokationer**, hver med egen QR, egen personale-PIN og eget udsnit af
statistikken. Stemplet deles på tværs af lokationerne (loyalitet følger brandet).

**Indtil da:**
- Én butik = én konto.
- En flerbutiks-forespørgsel før featuren findes → svar er **separate konti**
  (én pr. butik). Noter kunden som kandidat til lokations-featuren.

**Allerede gjort (fremtidssikring):** `Stamp.locationId String?` findes (nullable,
ingen tabel/logik endnu), så per-butik statistik kan bygges uden blind historik.
