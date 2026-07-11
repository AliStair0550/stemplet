# Stemplet

Det digitale stempelkort. Bygget af Alius.

Stemplet erstatter det fysiske stempelkort med et digitalt kort i kundens Apple Wallet (eller et webkort på Android). Virksomheden styrer det hele fra et enkelt dashboard. Kunder logger aldrig ind. De scanner en QR-kode og har deres kort på fem sekunder.

## Stak

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind v4 (design-tokens genbrugt 1:1 fra alius.dk)
- Prisma + PostgreSQL (Neon)
- Auth.js (magic link via Resend, kun til virksomheder)
- Upstash Redis (rate limiting og engangs-tokens)
- Stripe Billing (Pro, 99 kr./md., valgfrit)
- Logo gemmes direkte som data-URL (ingen ekstern billed-tjeneste)
- passkit-generator + APNs (Apple Wallet, bag feature flag)
- Vercel

## Kom i gang lokalt

1. Installer afhængigheder:

   ```bash
   npm install
   ```

2. Opret `.env.local` ud fra `.env.example` og udfyld:

   ```bash
   cp .env.example .env.local
   ```

   Som minimum for lokal udvikling skal du bruge:
   - `DATABASE_URL` og `DIRECT_URL` (Neon Postgres)
   - `AUTH_SECRET` (lav en: `openssl rand -base64 32`)
   - `AUTH_RESEND_KEY` og `EMAIL_FROM` (login-mails)
   - `UPSTASH_REDIS_REST_URL` og `UPSTASH_REDIS_REST_TOKEN` (stempler kræver Redis)
   - `NEXT_PUBLIC_APP_URL` (fx `http://localhost:3000`)

   `WALLET_ENABLED` kan blive `false`. Alt virker uden Apple Wallet via webkortet.

3. Opret databaseskema og seed demo-data:

   ```bash
   npm run db:migrate     # første gang: opretter tabeller
   npm run db:seed        # opretter "Demo Kaffebar" med liv i data
   ```

   Seed logger en demo-konto: login-mail `demo@stemplet.dk`, personale-PIN `1234`.

4. Start udviklingsserveren:

   ```bash
   npm run dev
   ```

   - Marketing: `/`
   - Onboarding: `/start`
   - Login (virksomheder): `/login`
   - Dashboard: `/app`
   - Kundens onboarding: `/k/demo-kaffebar`

## Sådan hænger det sammen

- **Kunden** scanner butikkens statiske QR (`/k/[slug]`), får et `CustomerCard` med et unikt `serial` og en device-cookie, så samme telefon altid rammer samme kort. Webkortet ligger på `/kort/[serial]` og kan føjes til hjemmeskærmen (PWA).
- **Stempling** sker kun på serveren. Kassemodus (`/app/kasse`) viser en roterende QR med et signeret engangs-token (JWT, 60 sek.). Kundens kamera rammer `/s/[token]`, som validerer, bruger jti een gang (replay umuligt via Redis), tjekker cooldown, lægger evt. kampagne-multiplier på og skriver stemplet.
- **Indløsning** kræver personale-PIN (bcrypt). Tre fejlforsøg låser enheden i 5 minutter.
- **Anomali**: mere end 5 stempler fra samme IP på en time markeres `FLAGGED` i audit-loggen og vises i dashboardet.

## Deploy til Vercel

1. Push repoet til GitHub og importer det i Vercel.
2. Sæt alle miljøvariabler fra `.env.example` i Vercel (Production + Preview). Husk at `NEXT_PUBLIC_APP_URL` skal være det rigtige domæne (fx `https://stemplet.alius.dk`).
3. Neon: brug den poolede connection string som `DATABASE_URL` og den direkte som `DIRECT_URL`.
4. Build-kommandoen er `prisma generate && next build` (allerede sat i `package.json`). Kør migrationer mod produktion:

   ```bash
   npx prisma migrate deploy
   ```

5. Stripe: opret et recurring price på 99 kr./md. og sæt `STRIPE_PRO_PRICE_ID`. Tilføj et webhook-endpoint til `https://<domæne>/api/stripe/webhook` med hemmeligheden i `STRIPE_WEBHOOK_SECRET`. Lyt på `checkout.session.completed` og `customer.subscription.*`.
6. Resend: verificer afsenderdomænet, så magic links kan sendes.

## Aktiver Apple Wallet

Alt Wallet-relateret er bygget, men gated bag `WALLET_ENABLED`. Når din Apple Developer-konto er klar:

1. **Opret et Pass Type ID** i Apple Developer (Certificates, Identifiers & Profiles -> Identifiers -> Pass Type IDs), fx `pass.dk.alius.stemplet`. Sæt det som `APPLE_PASS_TYPE_ID`.

2. **Generer et pass-certifikat** for det Pass Type ID og hent det. Eksporter certifikat + privat nøgle fra Nøglering som en `.p12`.

3. **Lav en PEM** af `.p12` (indeholder både certifikat og nøgle):

   ```bash
   openssl pkcs12 -in Certificates.p12 -out pass.pem -nodes
   base64 -i pass.pem | tr -d '\n' > pass.pem.b64
   ```

   Indholdet af `pass.pem.b64` bliver `APPLE_PASS_CERT`. Hvis nøglen har adgangskode, sæt den i `APPLE_PASS_CERT_PASSWORD`.

4. **Hent Apples WWDR-certifikat** (Worldwide Developer Relations), konverter til PEM og base64:

   ```bash
   openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
   base64 -i wwdr.pem | tr -d '\n' > wwdr.pem.b64
   ```

   Indholdet bliver `APPLE_WWDR_CERT`.

5. **Team ID**: dit 10-tegns Apple Team ID -> `APPLE_TEAM_ID`.

6. **APNs-nøgle** til live pass-opdateringer: opret en Auth Key (.p8) med APNs aktiveret. Base64-encode den til `APNS_KEY`, og sæt `APNS_KEY_ID` (nøglens 10-tegns id):

   ```bash
   base64 -i AuthKey_XXXXXX.p8 | tr -d '\n' > apns.p8.b64
   ```

7. **Slå flaget til**: sæt `WALLET_ENABLED="true"` og redeploy.

Når flaget er slået fra, viser kundens onboarding kun webkortet. Når det slås til, vises "Læg i Apple Wallet" som primær mulighed, og webkortet bliver et link. Ved hvert stempel og hver indløsning sender serveren en APNs-push, så passet opdaterer sig live i Wallet.

## Personale-guiden

En side, der forklarer personalet præcis, hvordan stempling og indløsning virker:

- I dashboardet under **Sådan virker det** (`/app/guide`).
- En delbar, læse-kun version på `/guide/<slug>`, som ejeren kan sende eller lave en QR til, uden at give dashboard-login. Den viser aldrig følsomme data (ingen PIN, nøgler eller kundedata).
- En **Print guide**-knap laver en A4-venlig sort/hvid version til bag disken (styret af `@media print` i `globals.css`).

**Én sandhedskilde.** Guiden må aldrig indeholde hardcodede systemværdier. Alle faste tal (kodens levetid, standard-cooldown, PIN-låsning, min/max stempler) bor i [`src/lib/system-config.ts`](src/lib/system-config.ts), som både stempel-motoren og guiden importerer fra. Butiksspecifikke værdier (cooldown, antal stempler, belønning, kampagner, Wallet til/fra) hentes live fra databasen via [`src/lib/guide.ts`](src/lib/guide.ts) og renderes server-side.

**Vedligehold:** Når stempel-motorens adfærd ændres, skal `src/lib/system-config.ts` og guide-teksten i [`src/components/guide/GuideContent.tsx`](src/components/guide/GuideContent.tsx) gennemgås i samme PR. `npm test` indeholder en test, der fejler, hvis guiden renderer uden værdierne fra `system-config` (fx at cooldown-teksten matcher den konfigurerede værdi).

## Kommandoer

| Kommando | Hvad |
|---|---|
| `npm run dev` | Udviklingsserver |
| `npm run build` | `prisma generate` + produktion-build |
| `npm test` | Kør tests (sikkerhed + personale-guide) |
| `npm run db:migrate` | Prisma-migration (dev) |
| `npm run db:seed` | Seed demo-data |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

---

Et produkt fra [Alius](https://alius.dk).
