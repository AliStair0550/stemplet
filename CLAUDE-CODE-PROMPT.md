# CLAUDE CODE PROMPT: BYG STEMPLET

Kopiér alt herunder ind i Claude Code, kørt fra mappen `Skrivebord/BUSINESS/KODER/alius-app`.

---

Du skal bygge **Stemplet**, et digitalt stempelkort-produkt fra Alius. Overskriv det eksisterende indhold i denne mappe (alius-app) fuldstændigt. Behold kun `.git`.

## Designsprog

Læs først `../alius-site` grundigt. Udtræk de præcise designtokens: farver, typografi (fonte, vægte, størrelser), spacing, knapstil, sektionstruktur og tone. Stemplet skal se ud og føles som en naturlig forlængelse af alius.dk. Genbrug tokens 1:1 i Tailwind-konfigurationen. Sprog: dansk. Stil: korte sætninger, ingen udråbstegn, ingen lange tankestreger (almindelige bindestreger i sammensatte ord er fine).

## Stack

- Next.js 14+ App Router, TypeScript, Tailwind
- Prisma + PostgreSQL (Neon)
- Auth.js med magic link via Resend (kun til virksomheder, kunder skal ALDRIG logge ind)
- Uploadthing til logo-upload
- Upstash Redis til rate limiting og engangs-tokens
- Stripe Billing til Pro-abonnement (99 kr./md.), Gratis-plan kræver intet kort
- `passkit-generator` til Apple Wallet, bag feature flag `WALLET_ENABLED` (se nederst)
- Deploy: Vercel

## Datamodel (Prisma)

```prisma
model Business {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  logoUrl          String?
  primaryColor     String   @default("#061C3D")
  textColor        String   @default("#FFFFFF")
  plan             Plan     @default(FREE)
  stripeCustomerId String?
  staffPin         String   // hashet (bcrypt)
  stampCooldownMin Int      @default(120)
  users            User[]
  cards            Card[]
  auditLogs        AuditLog[]
  createdAt        DateTime @default(now())
}

enum Plan { FREE PRO }

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
}

model Card {
  id             String  @id @default(cuid())
  businessId     String
  business       Business @relation(fields: [businessId], references: [id])
  stampsRequired Int     @default(10) // 4 til 12
  rewardText     String
  stampIcon      String  @default("coffee") // coffee, scissors, croissant, heart, star, custom
  active         Boolean @default(true)
  customerCards  CustomerCard[]
  campaigns      Campaign[]
}

model CustomerCard {
  id             String   @id @default(cuid())
  cardId         String
  card           Card     @relation(fields: [cardId], references: [id])
  serial         String   @unique // bruges i pass og stregkode
  authToken      String   @unique // hemmeligt, til Wallet web service
  stamps         Int      @default(0)
  completedCount Int      @default(0)
  contactEmail   String?  // valgfrit
  stampsLog      Stamp[]
  redemptions    Redemption[]
  walletRegs     WalletRegistration[]
  createdAt      DateTime @default(now())
  lastStampAt    DateTime?
}

model Stamp {
  id             String   @id @default(cuid())
  customerCardId String
  customerCard   CustomerCard @relation(fields: [customerCardId], references: [id])
  method         StampMethod
  tokenJti       String?  @unique
  multiplier     Int      @default(1)
  createdAt      DateTime @default(now())
}

enum StampMethod { KIOSK_QR STAFF_SCAN MANUAL }

model Redemption {
  id             String   @id @default(cuid())
  customerCardId String
  customerCard   CustomerCard @relation(fields: [customerCardId], references: [id])
  createdAt      DateTime @default(now())
}

model Campaign {
  id        String   @id @default(cuid())
  cardId    String
  card      Card     @relation(fields: [cardId], references: [id])
  type      CampaignType
  startsAt  DateTime
  endsAt    DateTime
}

enum CampaignType { DOUBLE_STAMP WELCOME_BONUS }

model WalletRegistration {
  id              String @id @default(cuid())
  customerCardId  String
  customerCard    CustomerCard @relation(fields: [customerCardId], references: [id])
  deviceLibraryId String
  pushToken       String
  @@unique([customerCardId, deviceLibraryId])
}

model AuditLog {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  action     String   // STAMP, REDEEM, PIN_FAIL, FLAGGED
  detail     Json
  ip         String?
  createdAt  DateTime @default(now())
}
```

## Sider og ruter

### Marketing (offentlig, roden `/`)

En sælgende produktside i Alius-design, målrettet små virksomheder med fysisk stempelkort i dag. Struktur:

1. **Hero.** Headline: "Stempelkortet, der aldrig bliver væk." Underrubrik: "Dine kunder scanner en QR-kode og har dit stempelkort i Apple Wallet på fem sekunder. Ingen app. Ingen tilmelding." CTA: "Kom gratis i gang" og sekundær "Se hvordan det virker". Signaturelement: et interaktivt stempelkort i hero, der får stempler ét ad gangen (subtil animation ved scroll eller klik, respekter prefers-reduced-motion). Kortet er bygget i HTML/CSS som en tro kopi af Wallet-passet.
2. **Problemet.** Kort sektion, sammenligning fysisk kort vs. Stemplet: kortet bliver væk, alle kan snyde med et håndstempel, nul viden om kunderne.
3. **Sådan virker det.** Tre trin: Scan. Stempl. Belønn. Ét trin pr. kolonne med enkel illustration.
4. **For dine kunder.** Ingen app, ingen konto, kortet minder dem om dig fra låseskærmen.
5. **Ingen kan snyde.** Sikkerhed som salgsargument: signerede engangsstempler, roterende QR, personale-PIN ved indløsning.
6. **Statistik.** Screenshot-agtig mock af dashboardet: genbesøg, stempler, indløsninger.
7. **Pris.** To kort: Gratis (1 kort, 50 aktive kunder, "Drevet af Stemplet" på kortet) og Pro 99 kr./md. (ubegrænset, eget brand, kampagner, fuld statistik). Linje under: "Ingen binding. Intet kreditkort for at starte. 99 kr. er mindre end én genkøbt kunde om måneden."
8. **FAQ.** Apple Wallet uden app, Android (webkort), hvad hvis kunden skifter telefon, opsigelse, GDPR (data ligger i EU, kunder kan være helt anonyme).
9. **CTA-sektion** og footer med "Et produkt fra Alius" og link til alius.dk.

### Kundeflow (offentlig)

- `/k/[slug]` Onboarding-side, som butikkens statiske QR peger på. Virksomhedens logo og farver. Én primær knap: "Læg i Apple Wallet" (vises kun når WALLET_ENABLED, ellers "Hent dit stempelkort"). Opretter CustomerCard og sætter en device-cookie med authToken, så samme telefon altid rammer samme kort.
- `/kort/[serial]` Webkortet (fallback og Android). Viser kortet med stempler, virksomhedens design, en stor "Scan for stempel"-knap, der åbner kameraet (bruger en letvægts QR-scanner i browseren), og kortets egen QR/stregkode til scan-modus. Skal fungere som PWA med manifest, så det kan føjes til hjemmeskærmen.
- `/s/[token]` Stempel-endpoint. Kundens kamera rammer denne URL fra kassemodus-QR'en. Validerer token, udsteder stempel, viser en tilfredsstillende stempel-animation og det opdaterede kort. Ved fejl: rolig forklaring ("Koden er udløbet. Bed personalet om at vise en ny.").

### Dashboard (kræver login, `/app/...`)

- `/app` Overblik: nøgletal og seneste aktivitet.
- `/app/kort` Kortdesigner: antal stempler (4 til 12), belønningstekst, stempel-ikon, logo-upload, farver med auto-forslag fra logo. Live preview af Wallet-passet ved siden af, opdateres mens man taster.
- `/app/kasse` Kassemodus: fuldskærm med roterende stempel-QR (nyt signeret token hvert 60. sekund, hentet via server), stor og skarp til at stå på en iPad ved disken. Fane to: Scan-modus, hvor personalet scanner kundens kort og stempler eller indløser. Indløsning kræver PIN.
- `/app/kampagner` (kun Pro) Dobbeltstempel-perioder og velkomstbonus.
- `/app/statistik` Aktive kunder, nye kunder, stempler pr. dag (graf), indløsninger, genbesøgsrate, tid til fuldt kort. CSV-eksport. Gratis-planen ser kun de to første tal plus en sløret preview med "Opgrader til Pro".
- `/app/materialer` Genererer print-klar PDF (A4-plakat og A6-diskskilt) med virksomhedens QR, logo og teksten "Scan og få dit stempelkort". Brug @react-pdf/renderer eller lignende.
- `/app/indstillinger` Virksomhedsprofil, personale-PIN, stempel-interval, audit log, abonnement (Stripe checkout og portal).

### Onboarding for virksomheder

`/start` Tre trin, maks. ti minutter: 1) e-mail og virksomhedsnavn, 2) design kortet (samme komponent som kortdesigneren), 3) print QR og gå i gang. Ingen betalingsoplysninger.

## Sikkerhed, skal implementeres præcis sådan

1. Stempel-tokens er JWT signeret med server-hemmelighed: payload { businessId, cardId, jti }, udløb 60 sekunder. Ved indløsning gemmes jti i Redis med TTL 10 minutter. Findes jti allerede, afvis (replay).
2. Rate limit: før et stempel udstedes, tjek `lastStampAt` mod `stampCooldownMin`. Afvis venligt hvis for tidligt.
3. Personale-PIN hashes med bcrypt. Tre fejlforsøg logger PIN_FAIL i AuditLog og låser indløsning i 5 minutter for den enhed.
4. Alle mutationer sker i server actions eller route handlers med validering (zod). Ingen stempel-logik på klienten.
5. Anomali-flag: mere end 5 stempler fra samme IP på tværs af kort inden for en time markeres FLAGGED i AuditLog og vises i dashboardet.
6. Kassemodus-siden kræver aktiv session og virker kun for eget businessId.

## Apple Wallet (bag feature flag)

Implementér fuldt, men gated bag `WALLET_ENABLED=false`:

- Pass-generering med `passkit-generator`: storeCard, virksomhedens logo og farver, stempelstatus som tekst og visuel stribe, stregkode med serial, `webServiceURL` og `authenticationToken`.
- PassKit Web Service-endpoints efter Apples spec: registrering (`POST /api/wallet/v1/devices/...`), afregistrering, hent opdaterede passes, hent pass, log-endpoint.
- APNs push ved hvert stempel og hver indløsning, så passet opdaterer sig live.
- Env-variabler klar i `.env.example`: `WALLET_ENABLED`, `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT` (base64), `APPLE_PASS_CERT_PASSWORD`, `APPLE_WWDR_CERT` (base64), `APNS_KEY`, `APNS_KEY_ID`.
- Når flaget er slået fra, viser onboarding kun webkortet. Når det slås til, vises "Læg i Apple Wallet" som primær og webkortet som link.

## Øvrigt

- Seed-script med en demo-virksomhed ("Demo Kaffebar", 10 stempler, "10. kop er gratis") og et par kundekort med stempler, så dashboard og statistik har liv fra start.
- `.env.example` med alle variabler og en kommentar pr. variabel.
- README på dansk: lokal opsætning, deploy til Vercel, og en trin-for-trin guide til at aktivere Apple Wallet, når Developer-kontoen er klar (opret Pass Type ID, generér certifikat, eksportér som .p12, base64-encode, sæt env-variabler, slå flaget til).
- Alt UI-tekst på dansk, i Alius-tonen. Ingen udråbstegn. Ingen lange tankestreger.
- Byg og kør `next build` til sidst, og ret alle fejl før du er færdig.

Afslut med:

```
git add . && git commit -m "Stemplet: komplet digital stempelkort-platform" && git push
```
