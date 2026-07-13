# Fuld gennemgang af Stemplet, 13. juli 2026

Gennemgang af korrekthed, sikkerhed, effektivitet og design (Apple-niveau). Fire
uafhaengige dybdegennemgange plus egen laesning af kundefladerne. Alt er verificeret
mod den faktiske kode, ikke antaget.

## Samlet vurdering

Produktet er solidt bygget. De vigtigste garantier holder:

- **Ingen kritiske huller** til gratis stempler, dobbelt-indloesning eller
  cross-tenant adgang (butik A kan ikke laese/aendre butik B). De transaktionelle
  `updateMany`-guards plus `@@unique([tokenJti, customerCardId])` lukker
  samtidigheds- og replay-racet korrekt, ogsaa hvis Redis falder.
- Stripe-webhook, PIN-lagring (bcrypt), auth-model (ingen selvbetjent signup,
  kunder logger aldrig ind) og hemmeligheds-hygiejne i logs er i orden.

Fundene er derfor primaert: to reelle SSRF-risici, et par "forkerte tal" i
statistikken, tunge queries der ikke skalerer, og en raekke design/tilgaengeligheds-
mangler (ingen synlige fokus-ringe, touch-maal under 44px, en regel-overtraedelse
med fejl i groen).

Alvorlighed: **KRITISK** > **HOEJ** > **MEDIUM** > **LAV** > **POLISH**.

---

## 1. Sikkerhed

| # | Alvor | Fund | Fil |
|---|-------|------|-----|
| S1 | HOEJ | SSRF via `logoUrl`: hentes server-side ved pass-bygning uden privat-IP-vaern | src/lib/wallet/pass.ts:30, src/lib/validation.ts:47 |
| S2 | HOEJ/MED | Webhook-SSRF kan omgaas via redirect-follow og DNS-rebind (kun praeflight-lookup) | src/lib/integrations.ts:66 |
| S3 | MEDIUM | `.pkpass` kan hentes af alle der kender det offentlige serienr. -> Wallet-`authToken` eksponeres | src/app/api/wallet/pass/[serial]/route.ts:16 |
| S4 | MEDIUM | PIN-laas kan omgaas ved at spoofe `X-Forwarded-For` (roterer laase-noeglen) | src/lib/http.ts:4, src/app/api/staff/redeem/route.ts:28 |
| S5 | MEDIUM | Rate limit fejler aabent: ved Redis-nedbrud er magic-link-spam ubeskyttet | src/lib/redis.ts:60 |
| S6 | LAV/MED | `find-kort` binder kort til enhed ud fra serienr. alene, uden throttling/andet led | src/app/find-kort/actions.ts:26 |
| S7 | LAV | Wallet-token sammenlignes ikke konstant-tid | src/lib/wallet/build.ts:38 |
| S8 | LAV | Bruger-enumeration paa login; unsubscribe aendrer tilstand paa GET; delt HMAC-noegle til to token-typer | login/actions.ts, api/email/unsubscribe, tokens.ts |

**Bekraeftet korrekt:** cross-tenant IDOR (alle id/serial/slug-ruter tjekker ejerskab),
cookie-scoping pr. butik, jti-replay + DB-backstop, stamp-token-verifikation (HS256,
exp), Stripe-signatur, bcrypt-PIN, atomiske mutationer, CSRF (server actions + SameSite).

## 2. Korrekthed

| # | Alvor | Fund | Fil |
|---|-------|------|-----|
| K1 | MEDIUM | `avgDaysToFull` overvurderer: maaler fra kort-oprettelse, ikke pr. cyklus, saa loyale kunder tr.aekker tallet op | src/lib/stats.ts:130 |
| K2 | MEDIUM | `clientIp` stoler paa spoofbar leftmost XFF (samme rod som S4) | src/lib/http.ts:4 |
| K3 | LAV/MED | Cooldown er check-then-act, ikke haandhaevet i den atomiske update -> +1 muligt i race | src/lib/stamp.ts:79 |
| K4 | LAV | Velkomstbonus kan fordobles ved samtidige foerste-stempler | src/lib/stamp.ts:97 |
| K5 | LAV | FREE-graensen (100) kan overskrides i race (count-then-create) | src/app/k/[slug]/actions.ts:35 |
| K6 | LAV | `buildPerDay` kan tabe/duplikere en dag ved sommertidsskift (2x om aaret) | src/lib/stats.ts:175 |
| K7 | LAV | To definitioner af "denne uge" (dashboard = Koebenhavns-dage, mail = rullende 168t UTC) | src/lib/stats.ts:100 vs :220 |
| K8 | LAV | Carry-overshoot kan vise "11/10" i pass-header indtil indloesning | src/lib/wallet/pass.ts:79 |
| K9 | LAV | APNs laeser aldrig svar-status: doede push-tokens ryddes aldrig | src/lib/wallet/apns.ts:48 |

## 3. Effektivitet

| # | Alvor | Fund | Fil |
|---|-------|------|-----|
| E1 | HOEJ | `getBusinessStats` henter ALLE kundekort + ALLE indloesninger som fulde raekker for at udregne ~6 tal; vokser lineaert med kundetal, koeres paa hver dashboard-load | src/lib/stats.ts:64 |
| E2 | HOEJ | Manglende tids-indekser paa `Stamp.createdAt` og `Redemption.createdAt`; alle tids-vinduer scanner | prisma/schema.prisma:150 |
| E3 | MEDIUM | Ugebrev-cron er N+1 over butikker (6 sekventielle queries pr. butik) | src/app/api/cron/weekly-stats/route.ts:48 |
| E4 | MEDIUM | Pooled `DATABASE_URL` mangler `pgbouncer=true`/`connection_limit` (serverless-stabilitet) | .env, src/lib/prisma.ts |
| E5 | MEDIUM | `business.findUnique` koeres to gange pr. dashboard-request (layout + page) | src/lib/session.ts:26 |
| E6 | LAV | Stempel-hot-path loader hele kort-grafen to gange + laeser tilbage efter update | src/lib/stamp.ts:57,127 |
| E7 | LAV | Dashboard henter 14 dages stempel-raekker for at bygge 14 tal (kunne vaere groupBy) | src/lib/stats.ts:77 |

## 4. Design og UX (Apple-niveau)

**System (rammer alt):**

- **D-A1 (must-fix):** Ingen synlige fokus-ringe nogen steder; inputs fjerner endda
  outline. Tastatur-brugere kan ikke se hvor de er. `src/components/ui.tsx` + alle inputs.
- **D-A2 (must-fix):** Touch-maal under 44px paa de mest brugte kontroller. Vaerst er
  Kassemodus-fanerne (~29px) som personalet rammer hele tiden. `ui.tsx`, `Kassemodus.tsx`.
- **D-A3 (should-fix):** ~20 forskellige font-stoerrelser og 7 micro-label-stoerrelser
  til samme job; ingen modulaer skala.
- **D-A4 (should-fix):** ExtraLight brOEdtekst i lille `slate` ligger under 4.5:1 kontrast.
- **D-A5 (should-fix):** Hjoerne-radius spaenner 2-24px uden system; kasse-skaermene foeles
  som et blOEdere, andet produkt end det skarpe dashboard.

**Kunde-stempelkort (hoejeste prioritet):**

- **D-B1 (should-fix):** "Klar"-gloeden er hardkodet moss-groen oven paa butikkens EGEN
  kortfarve; bryder loeftet "altid i butikkens brand". `StampCard.tsx`.
- **D-B2 (should-fix):** Manuelle farvevaelgere har ingen kontrast-tjek -> en butik kan
  sende et ulaeseligt kort. `CardDesigner.tsx`.
- **D-B3 (should-fix):** Tomme stempelfelter er for svage til at kunne se maalet paa moerke kort.
- **D-B4 (polish):** Den dekorative "stregkode" ligner en rigtig (defekt) stregkode; kunder proever at scanne den.
- **D-B5 (should-fix):** Kortvisningen har to konkurrerende primaerknapper (moss fyldt + ink fyldt).

**Stempel-bekraeftelsen (det foelelsesmaessige hoejdepunkt):**

- **D-C1 (should-fix):** Det HVERDAGS-stempel (95%-tilfaeldet) faar den kedelige
  behandling; kun det fulde kort foeles designet. Kunden ser aldrig sit kort fyldes.
- **D-C2/C3 (polish):** Loading er en tvetydig pulserende klat; fejl-tilstand har ingen vej videre (ingen "Proev igen").

**Dashboard:**

- **D-D1 (must-fix, REGEL-BRUD):** "Mistaenkelig aktivitet" og "Forkert PIN" vises i
  brand-groen (`text-moss`) i stedet for `text-rust`. Direkte brud paa AGENTS.md. `src/app/app/page.tsx`.
- **D-D3 (should-fix):** `BarChart`-vaerdier er kun i hover-tooltip; usynlige paa mobil (hvor ejeren tjekker).
- **D-D5 (polish):** `AnimatedNumber` blinker facit -> 0 -> taeller op ved foerste paint.
- **D-D6 (should-fix):** Inputs har ingen fejl-styling; besked og felt er ikke koblet.

**Marketing:**

- **D-E1 (should-fix):** Mobil-nav dropper den primaere CTA "Kom gratis i gang" helt (ingen hamburger).
- **D-E2/E3/E4 (polish):** Italic-accent i to vaegte; to forskellige chart-implementeringer; `moss` baerer for mange semantiske roller.

---

## Handlingsplan

### A. Implementeres nu (sikre, lav risiko

Design: fokus-ringe + 44px touch-maal (D-A1/A2), fejl-i-rust (D-D1), gloed fra
kortets egen farve (D-B1), laesbare tomme felter (D-B3), knap-hierarki paa kort
(D-B5), kontrast-vaern paa farvevaelger (D-B2), input-fejlstil (D-D6),
BarChart-vaerdier paa mobil (D-D3), AnimatedNumber-fix (D-D5), mobil-CTA (D-E1),
accent-vaegt (D-E2), broedtekst-kontrast (D-A4), loading/fejl-polish + "Proev igen" (D-C2/C3).

Korrekthed: atomisk cooldown + velkomstbonus (K3/K4), DST-fix (K6),
carry-visning "11/10" (K8), konstant-tid Wallet-sammenligning (K7/S7).

Sikkerhed: privat-IP-vaern paa `logoUrl` (S1), `redirect:"manual"` + genkontrol paa
webhook (S2), betroet klient-IP til PIN-laas (S4/K2).

Effektivitet: tids-indekser + migration (E2), `cache()`-dedup af butik-opslag (E5).

### B. Kraever din godkendelse (stoerre / adfaerds- / prod-aendring)

1. **Statistik-omskrivning** (E1 + K1): erstat de ubegraensede raekke-hentninger med
   aggregerede queries og ret `avgDaysToFull` til pr. cyklus. Aendrer viste tal ->
   skal verificeres. Anbefales.
2. **Hverdags-stemplet redesignes** (D-C1): vis kortet fyldes i bekraeftelsen. Synlig
   UX-aendring. Anbefales, hoej vaerdi.
3. **Adfaerds/prod-haerdning:** fail-closed/DB-fallback paa magic-link (S5),
   `pgbouncer=true`+`connection_limit` paa pooled URL (E4), unsubscribe GET -> POST (S8/K11). Anbefales.
4. **Wallet-token-arkitektur** (S3): behandl `authToken` som ikke-hemmelig og gate
   register/unregister paa en separat noegle. Stoerre aendring.
5. **Ovrige:** cron-batching (E3), APNs-status/oprydning (K9), find-kort throttling +
   andet led (S6), FREE-graense atomisk (K5).

---

## Implementeret 13. juli 2026

Godkendt af bruger: statistik-omskrivning, hverdags-stemplet redesignes, magic-link
fail-closed. Udskudt bevidst: pgbouncer-pooling, unsubscribe GET->POST, Wallet-token-
arkitektur (S3).

**Design (commits 8fdc458, 4adcfd5, 071aeed):**
- D-A1 Synlige fokus-ringe paa alle knapper + formularfelter
- D-A2 44px touch-maal; Kassemodus-faner er nu 48px segment-kontrol, fuld bredde mobil
- D-D1 Fejl/PIN-fejl i `text-rust` med rust-prik (regel-fix)
- D-B1 "Klar"-gloed fra kortets egen farve; D-B3 laesbare tomme felter; D-B5 eet
  primaerknap-hierarki paa kortvisning; D-B2 kontrast-vaern + "Ret automatisk" i designer
- D-C1 Hverdags-stemplet viser kortet fyldes ("Fire af ti", n tilbage); D-C2/C3
  loading-ghost + fejl-glyph med "Proev igen"
- D-A4 Loeftet ExtraLight helper-tekst; D-D5 AnimatedNumber uden blink; D-D3 BarChart-
  vaerdier paa mobil; D-D4 StatTile-hover fjernet; D-D6 PIN-hjaelpetekst
- D-E1 Mobil-CTA "Kom gratis i gang"; D-E2 ensartet Fraunces-accent

**Sikkerhed (commit aeb09ff):** S1 logoUrl-SSRF-vaern, S2 webhook redirect:manual +
multi-A-record, S4 betroet x-real-ip, S7 konstant-tid, S5 magic-link fail-closed
(SendThrottle + migration).

**Korrekthed (commit fa02a5d):** K3 atomisk cooldown, K4 atomisk velkomstbonus, K6
DST-sikre dagsbuckets, K8 carry-visning klampet.

**Effektivitet (commit 36a5112):** E1 aggregeret statistik (verificeret 0 afvigelser),
K1 avgDaysToFull pr. cyklus (demo 5.1 -> 2.5), E2 tids-indekser + migration, E5
cache()-dedup af butik-opslag.

## Anden runde (forside + resten af de udskudte)

Forside (commit 5b15455): "Faa flere stamkunder" flyttet op lige efter hero og
lavet om til en animeret forklaring (eet kort koerer hele livscyklussen: scan ->
saml 10 -> PIN -> ny runde, med trinene synkroniseret). Sikkerheds-sektionen er
nu sort (bg-ink) med moss-lys.

Backend/resten:
- S6 find-kort rate-limitet pr. IP (commit bec9cf3)
- K9 APNs laeser status + rydder doede tokens (bec9cf3)
- E3 ugebrev-cron koerer med begraenset samtidighed (bec9cf3)
- S8 unsubscribe: GET = bekraeft-side, POST = handling (bec9cf3)
- E4 pgbouncer=true + connection_limit=1 paa pooled DATABASE_URL (lokal .env
  klaret; SAMME aendring skal laves paa Vercels DATABASE_URL-env)
- S3 Wallet-pass-download gated paa device-cookie (commit 5eba8f0)
- A3/A5 radius samlet paa rounded-lg, type-skala kodificeret som tokens (f0fcaaa)

**Udestaar stadig (lav prioritet):** S8 bruger-enumeration + delt HMAC-noegle, K5
FREE-graense race, E6/E7 mindre query-optimering, D-B4 dekorativ stregkode,
fuld per-instans type-migrering (tokenne er sat, inline-stoerrelser konvergerer
over tid).

**Handling hos dig:** Tilfoej `pgbouncer=true&connection_limit=1` til Vercels
`DATABASE_URL` (efter `sslmode=require`), IKKE til DIRECT_URL, og redeploy.
