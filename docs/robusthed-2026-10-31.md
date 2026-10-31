# Robusthed 31. oktober 2026

Gennemgang af Folka Kort efter testrunden (PR #69 til #77). Fire spor: data og samtidighed, eksterne afhængigheder, adgang og misbrug, drift og vækst. Plus de live fejl fra Vercel. Kun læsning, intet er ændret.

**Samlet:** Ingen P0. Ingen butik kan se eller ændre en anden butiks data, og de vigtigste flows (stempel, indløsning, henvisning, pushbesked) er låst mod dobbelttryk. Svaghederne ligger i det, der sker *bag* skærmen: Wallet-opdateringer til mange kort, databaseforbindelser og fejl, som ingen ser. De bider først for alvor, når butikkerne har tusindvis af kort, men et par af dem kan ramme i dag.

Prioritet: **P1** = kan ramme i normal brug eller ved vækst, **P2** = sjældnere, **P3** = oprydning. Indsats: S (timer), M (en dag), L (flere dage).

## Live signal

Databasen løber tør for forbindelser (P2024). Ni gange siden juli, senest 30. oktober, også efter puljen blev sat til 5. Altid i den tunge statistik (`business-stats-heavy`), som kører mange forespørgsler samtidig. Kunderne har ikke mærket det, men det er det første, der knækker ved flere butikker.

## P1: ret snart

| # | Fund | Hvad sker der | Indsats |
|---|---|---|---|
| R1 | **En forkert Apple-indstilling sletter alle Wallet-registreringer.** Ethvert APNs-svar 400 behandles som "kunden har fjernet kortet". | Én fejl i APPLE_PASS_TYPE_ID, og næste stempel sletter registreringerne for alle berørte kort uden besked til Sentry. Kortene opdaterer aldrig igen, før kunden henter dem på ny. Kun 410 og 400 "BadDeviceToken" bør slette. (`src/lib/wallet/apns-status.ts`) | S |
| R2 | **Udsendelse til alle kort i Wallet kan gå i stå uden, at nogen ved det.** Hver pushbesked og hver Gem under Design, Regler og Henvisninger opdaterer alle butikkens kort. Hvert kort åbner sin egen forbindelse til Apple, der er ingen tidsgrænse, og fejl gemmes væk. | Ved 1.000+ kort tager det minutter. Stopper funktionen undervejs, får resten af kunderne aldrig pushbeskeden, men ejeren har set "Sendt til 1.000" og kan ikke sende igen i 24 timer. Fem hurtige Gem giver fem fulde udsendelser. Apple kan opfatte mange korte forbindelser som misbrug, og det rammer alle butikker, fordi de deler samme kort-id. | S (tidsgrænser) + M (delt forbindelse, samling af Gem, genoptagelse) |
| R3 | **Billeder ligger i butikkens række og læses ved hvert stempel.** Logo, kortets billede og plakatbilledet ligger som tekst i databasen, op til ca. 2 MB pr. butik, og hele rækken hentes 3-4 gange pr. stempel. | Langsommere stempler og lange låse i databasen. Ved 5.000 stempler om dagen er det 6-40 GB dataoverførsel om dagen fra Neon. Hænger sammen med forbindelses-fejlen ovenfor. | M (hent kun det nødvendige) / L (billeder til Vercel Blob) |
| R4 | **"Stempler" som henvisningsbelønning giver ingen stempler.** Man kan vælge fx "3 stempler" som belønning, men ved indløsning skifter kun status. | Kassen siger "3 stempler er indløst", men kortet står stille. Kunden mister belønningen, medmindre personalet husker at stemple i hånden. | M. **Kræver beslutning** |
| R5 | **Dobbelttryk på "Hent kort".** Knappen er kun beskyttet af skærmens tilstand, ikke af en lås. | Ny kunde: to kort, det ene uden kontakt, og kunden kan få fejlen "mailen findes allerede". Kendt telefon: velkomststemplet kan blive givet to gange. Samme slags fejl, som blev rettet i kassen. | S-M |
| R6 | **"Find mit kort" kan bruges til at oversvømme en kundes indbakke.** Serienummeret står under stregkoden, og siden har kun et loft pr. IP-adresse, ikke pr. modtager. | Nogen med kundens kort kan sende uendeligt mange gendan-mails i butikkens navn. Det skader også mail-omdømmet for alle butikker. | S |
| R7 | **Fejl i baggrundsarbejde ses ikke.** Mislykkede Wallet-opdateringer, webhooks og Apple-forbindelsesfejl skrives kun i loggen, som Vercel Hobby gemmer i én time. | Et kort, der ikke opdaterer, opdager vi kun, hvis kunden klager. | S |
| R8 | **Backup er ikke afprøvet.** Intet i repoet tager kopi af databasen eller øver en gendannelse. | Afhænger af Neon-planen: på gratisplanen er historikken timer, så en fejlsletning, der opdages næste dag, er tabt. | S. **Kræver Ali (Neon-plan)** |

## P2: sjældnere, men værd at lukke

| # | Fund | Indsats |
|---|---|---|
| R9 | Logoer genkodes ikke og har ingen pixelgrænse. Et lille, stærkt komprimeret billede kan fylde 1 GB i hukommelsen og vælte serveren for andre butikker. SVG accepteres. | S-M |
| R10 | Stempel-, indløsnings- og fortryd-låsen mod dobbelttryk ligger kun i Redis og slipper igennem, hvis Redis er nede. Dør funktionen midt i, afvises genforsøg i 10 minutter. Henvisninger har låsen i databasen, stempler ikke. | M (datamodel) |
| R11 | Redis og Resend har ingen tidsgrænse. Er Redis nede, bliver hvert stempel ca. 4 sek. langsommere, og hænger det, står kassen. Hænger Resend, drejer login-hjulet til funktionen dør, og tre mailfejl låser ejeren ude i en time. | S |
| R12 | Logo fra en adresse (ikke uploadet) hentes uden tidsgrænse og størrelsesloft. Hvert kort-download venter på den. | S |
| R13 | Midlertidige Apple-fejl (overbelastning, nedbrud) prøves aldrig igen. Kortet viser først stemplet ved næste stempel. | S |
| R14 | Den daglige cron: fejler én opgave, stopper resten (fx certifikat-varslet og udløb af henvisninger). Stopper cronen helt (fx forkert CRON_SECRET), får vi ingen besked. | S |
| R15 | Deploy fejler, når Neon sover (P1001 under `migrate deploy`). Fejler sikkert (den gamle version kører videre), men kræver manuelt redeploy. Løsning: tre forsøg med pause. | S |
| R16 | Hæver ejeren antal stempler (fx fra 10 til 12), mister kunder med fuldt kort deres klare belønning. | **Besluttet 31. okt:** sådan skal det være. Kunden beholder stemplerne og samler de ekstra. Ingen ændring. |
| R17 | Mails om prøveperiode og faktura kan sendes to gange: hvis kun den ene af to mails lykkes, eller hvis cronen kører dobbelt. | S-M |
| R18 | Admin "Nulstil stempler" nulstiller ikke livstidstælleren, så den daglige kontrol melder fejl, og milepæle senere tæller forkert. | S |
| R19 | Slettes en henvisers kort, kan vennerne henvises igen og få velkomstrabatten to gange. | M (datamodel) |
| R20 | Admin-siderne henter alle butikker med alle billeder (25-100 MB ved 50 butikker). | S |
| R21 | CI bygger ikke appen (`next build`) og tjekker ikke, at skemaet matcher migrationerne. Fejl ses først på Vercel. | S-M |
| R22 | Apple henter hele kortet igen, selvom intet er ændret (`If-Modified-Since` ignoreres). Unødig belastning. | S |

## P3: oprydning

- Tilmelding afslører, om en e-mail allerede har kort i butikken (svar "mailen findes"). Gendan-siden er bygget til at undgå netop det.
- En parringskode til kassen kan oprette ubegrænset mange enheder i 30 minutter. Loft på 2-3 og besked til ejeren.
- Adresse og webhook-adresse har ingen længdegrænse.
- `?tekst=` to gange i adressen får Pushbeskeder til at fejle.
- API-nøgler gemmes i klartekst. Gem en hash.
- `walletCardCount` henter alle rækker for at tælle.
- Fortryd fjerner det nyeste stempel uanset enhed og alder. Velkomststempel kan gives igen efter fortryd til 0.
- Kiosk: koden bruges op før stemplet gemmes, så en databasefejl giver "Koden er allerede brugt".
- Ugemailen har ingen beskyttelse mod dobbelt afsendelse.
- Varsel om prøveperiode kan komme 1-2 dage sent ved oprettelse sidst på måneden.
- Wallet-registrering: samtidige registreringer giver en kort 500 (Apple prøver igen).
- `/proev` kan vise "demo ikke tilgængelig" i en time efter et databaseblip.
- Fremtidige migrationer: skriv reglen ned (tilføj før fjern, indeks samtidig), så store tabeller ikke låses.

## Allerede solidt (åbn ikke igen)

Butikker er adskilt overalt (hver handling tjekker butikken). Stempel, fuldt kort og indløsning er låst mod dobbelttryk i databasen. Henvisninger har lås og loft pr. måned. Pushbesked kan kun sendes én gang i døgnet. Tokens i links er lange og signerede. Login-kode og tilmelding har lofter. Certifikat-udløb overvåges. Geokodning og webhooks har tidsgrænser. Kortet falder tilbage til webkort, hvis Wallet-signering fejler.

## Forslag til rækkefølge

**Bølge 1 (sikre og små, kan laves med det samme):** R1, R2 (tidsgrænser), R5, R6, R7, R11, R12, R14, R15, R18, R20, P3 `?tekst=` og længdegrænser.

**Bølge 2 (vækst):** R3 (hent kun det nødvendige), R2 (delt forbindelse, samling af Gem, genoptagelse), R13, R22, R9, R21, statistikken bag forbindelses-fejlen.

**Bølge 3 (datamodel, godkendes først):** R10, R17, R19, API-nøgle som hash, billeder til Vercel Blob.

**Besluttet 31. okt:** R4 bygges ikke nu (personalet giver stemplerne i hånden). R8 venter, til der er betalende butikker (gratisplan hos Neon indtil da). R16: kunden beholder stemplerne og samler de ekstra.

**Status bølge 1:** færdig. Del 1 (#79): R1, R2 (tidsgrænse pr. besked til Apple), R7, R14 og R15. Del 2: R5, R6, R11, R12, R18, R20, `?tekst=` og længdegrænser på adresse og webhook.
