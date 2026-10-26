# Henvisninger: arkitektur og design

Oct 26, 2026 · @Alix

## Hvad vi bygger

Henvisninger er et modul i Stemplet-platformen med sin egen forside på alius.dk/henvisninger. Kunden deler en personlig kode, vennen får rabat ved første besøg, og kunden får sin belønning når vennen har været der. Alt kører uden adgang til booking-systemets kundedata, så det virker ved siden af Planway, Bookio og alle andre.

Målgruppe: frisører, tandlæger, fysioterapeuter, kosmetologer, klinikker. Alle der lever af faste kunder og hvor en anbefaling fra en ven er den stærkeste kanal.

Hvorfor det ligger inde i Stemplet og ikke som et separat produkt:

- Samme kunde, samme kasse, samme QR, samme login. To systemer giver to onboardings og to fakturaer.
- Wallet-udstedelse, token-validering, dashboard, superadmin, fakturering, tests og CI findes allerede. Det nye er henvisningslogikken, ikke infrastrukturen.
- Wallet-pipelinen (iOS 27 Poster-layout, Google Wallet, certifikater) skal kun vedligeholdes ét sted.
- Krydssalg er gratis: en frisør med henvisning får stempelkort med ét klik, og omvendt.

Udadtil er det to produkter med hver sin forside og hvert sit sprog. Indadtil er det én platform med to feature-flag pr. butik: `stamps_enabled` og `referrals_enabled`.

Pris: samme prisliste som Stemplet. Gratis op til 100 kortholdere, Pro 99 kr./md. Henvisninger er med i Pro, ikke et tillæg. Henvisning er det argument der får en frisør til at betale, stempelkort alene er det ikke.

## Arkitektur

Cirka 80 procent af systemet findes allerede i Stemplet. Det nye er fire ting: en henvisningsmodel i databasen, en delingsside pr. butik, en fane i dashboardet og en knap i kassepanelet.

| Lag | Genbruges fra Stemplet | Nyt for Henvisninger |
| --- | --- | --- |
| Forside | alius.dk og stemplet.dk | alius.dk/henvisninger, egen tekst og eget tilbud |
| Onboarding | Opret butik, vilkår, Pro-godkendelse ved 80 kortholdere | Valg af modul(er) og opsætning af belønningsregler |
| Kundeside | QR-landingsside pr. butik, oprettelse med navn og mobil | Delingsside med kode i URL, to tilstande (henvis / indløs) |
| Wallet | Apple og Google Wallet-udstedelse, push-opdateringer, per-kort tokens | Kortet viser henvisningskode, delingsknap og optjente belønninger |
| Kassepanel | Scan eller tast, stempling med advisory locks og idempotency keys | Knapperne "Første besøg gennemført" og "Belønning indløst" |
| Dashboard | Butiksoverblik, kortholdere, eksport | Fanen Henvisninger med tal, liste og top-ambassadører |
| Superadmin | Alle butikker, pakker, fakturering, stopknap | Henvisningstal pr. butik og det samlede henvisningstræ |
| Database | Postgres: business, cardholder, card, stamp | referral, reward, referral\_rule (se datamodel) |
| Infrastruktur | Next.js, Postgres, Upstash Redis, S3, GitHub Actions, Billy/Stripe | Intet nyt |

To principper der holder det enkelt:

1. Ét kort pr. kunde pr. butik. Kortet viser stempler, henvisning eller begge dele, styret af butikkens feature-flag. Ingen separat "henvisningskort".
2. Belønning udløses kun fra kassepanelet. Oprettelse via link skaber en åben henvisning, men ingen værdi. Det lukker for misbrug med falske tilmeldinger.

&#91;embedded content: arkitektur · to forsider, én platform\]

Begge forsider fører ind i samme onboarding. Det der er markeret med farve er alt det nye, resten står allerede i Stemplet.

## Datamodel

Tre nye tabeller og to nye felter. Alt andet er eksisterende Stemplet-tabeller.

**Nye felter på eksisterende tabeller**

| Tabel | Felt | Formål |
| --- | --- | --- |
| business | referrals\_enabled (bool) | Slår modulet til pr. butik |
| card | referral\_code (text, unik pr. butik) | Kundens personlige kode, fx SARA-K8 |
| card | referred\_by\_card\_id (nullable) | Hvem der henviste denne kunde, giver hele træet |

**referral\_rule** (én pr. butik, kan ændres af butikken)

| Felt | Eksempel |
| --- | --- |
| new\_customer\_reward\_type / value | amount, 100 |
| referrer\_reward\_type / value | amount, 100 (eller stamps, 3, eller service, "Gratis klip") |
| min\_purchase\_kr | 300 |
| max\_referrals\_per\_month | 5 |
| reward\_expiry\_days | 180 |
| terms\_line | "Gælder ved første besøg over 300 kr." |

**referral** (én pr. henvisning, kobler to kort)

| Felt | Formål |
| --- | --- |
| id, business\_id | Nøgler |
| referrer\_card\_id | Ambassadøren |
| referred\_card\_id | Den nye kunde |
| status | created, visited, rewarded, expired, voided |
| source | link, code\_entered, manual\_at\_desk |
| created\_at, visited\_at, rewarded\_at | Tidsstempler pr. overgang |
| visited\_by\_staff\_id | Hvem trykkede "gennemført" |

**reward** (én pr. optjent belønning, både til henviser og ny kunde)

| Felt | Formål |
| --- | --- |
| id, business\_id, card\_id | Hvem ejer belønningen |
| referral\_id | Hvor den kom fra |
| type, value | amount 100, stamps 3, service "Gratis klip" |
| status | available, redeemed, expired |
| expires\_at, redeemed\_at | Udløb og indløsning |

Regler der skal ligge i koden, ikke i hovedet på frisøren:

- Et kort kan kun have ét referred\_by. Kommer en kunde ind via to links, vinder det første.
- Man kan ikke henvise sig selv (samme mobilnummer eller samme kort).
- Overgangen created til visited sker kun fra kassepanelet og kræver staff-id. Samme idempotency-mønster som stempling, så et dobbelttryk ikke giver to belønninger.
- Overgangen visited til rewarded sker automatisk i samme transaktion og opretter to reward-rækker.
- Loftet (max pr. måned) tælles på rewarded, ikke created. Ellers kan man blokere en kunde med tomme tilmeldinger.
- Belønninger udløber via et dagligt cron-job, som Stemplet allerede har til threshold-alerts.

## Flows, skærm for skærm

Tre roller: butikken, kassen og kunden. Kunden må aldrig skulle vælge mellem "henvis" og "indløs". Det valg træffer linket for hende.

&#91;embedded content: henvisningskæden · 5 trin, 1 loop\]

Det farvede trin er det eneste der skaber værdi. Alt før det er gratis at oprette, så ingen kan tjene på falske tilmeldinger.

**Butikken opretter sig (under 5 minutter)**

1. Opret butik: navn, adresse, logo, farve. Samme som Stemplet.
2. Vælg modul: Stempelkort, Henvisninger eller begge.
3. Sæt belønningsregler: belønning til ny kunde, belønning til henviser, minimumskøb, betingelser i én linje.
4. Færdig. Butikken får QR til kassen (print-klar PDF) og et link til Instagram og hjemmeside.

**Kunden lander uden kode** (QR ved kassen, Instagram-link): `alius.dk/henvisninger/sara-salon`

1. Overskrift: "Henvis en ven og få 100 kr."
2. Navn og mobil, én knap.
3. Straks: din kode, en delingsknap (færdig besked med link) og "Tilføj til Wallet". Wallet er valgfrit, siden virker alene.

**Kunden lander med kode** (en vens link): `alius.dk/henvisninger/sara-salon?k=SARA-K8`

1. Overskrift: "Sara har givet dig 100 kr. hos Sara Salon".
2. Navn og mobil, én knap.
3. Straks: dit velkomstkort med rabatten, "Tilføj til Wallet" og "Book tid" (link til Planway). Nederst: "Du kan også selv henvise", med egen kode. Den nye kunde er ambassadør fra dag ét.

Kom kunden ind uden link, men siger "jeg kommer fra Sara" ved kassen, kobler frisøren det i panelet. Et lille kodefelt nederst på oprettelsessiden dækker resten.

**Kassen (det der afgør om det virker)**

- Ny kunde kommer: frisøren scanner Wallet-kortet eller søger på navn/mobil. Ét tryk: "Første besøg gennemført". Begge belønninger oprettes, begge kort opdateres med push.
- Ambassadøren kommer igen: scan eller søg. Panelet viser "100 kr. til gode". Ét tryk: "Belønning indløst".
- Begge knapper tager under 10 sekunder. Alt der kræver mere ender i skuffen.

**Dashboardet, fanen Henvisninger**

- Øverst tre tal: åbne henvisninger, gennemførte denne måned, belønninger der venter på indløsning (det er en forpligtelse, den skal være synlig).
- Liste over nyeste henvisninger: henviser, ny kunde, dato, status, med de to knapper direkte i rækken.
- Top-ambassadører: de 10 procent der driver 80 procent.
- Eksport til CSV til SMS-udsendelser.

Fanen Henvisninger og fanen Stempler har hver sin farve og sit sprog. Stempler taler om kortholdere og stempler. Henvisninger taler om ambassadører og henvisninger. Samme ramme, forskelligt indhold. En butik med kun ét modul ser kun én fane.

## Visuel stil og design

Henvisninger har sin egen stil: moderne, minimalistisk og rolig, i stil med Apple. Hvidt rum, store overskrifter, én accentfarve, ingen dekoration. Alt der ikke hjælper kunden med at forstå eller trykke, fjernes. Kundesiden og Wallet-kortet bærer butikkens logo og farve oven på denne base, så frisøren aldrig skal forklare hvad Alius er.

**Navn og placering**

- Produktnavn: Henvisninger. Ikke "Alius Henvisninger", ikke "henvisningsprogram".
- Forside: alius.dk/henvisninger, under Produkter sammen med Stemplet.
- Kundeside: `alius.dk/henvisninger/<butik>` fra start. Domænet henvisninger.dk er ledigt og købes nu, men tages først i brug når der er trafik. Når det sker, bliver `henvisninger.dk/<butik>` den korte adresse på kortet ved kassen, og den gamle adresse redirecter.

**Palette (forside, kundeside, dashboard)**

| Rolle | Farve | Bruges til |
| --- | --- | --- |
| Baggrund | Hvid #FFFFFF | Hero og indhold |
| Sekundær flade | Lys grå #F5F5F7 | Skiftende sektioner, kort, inputfelter |
| Tekst | Næsten sort #1D1D1F | Overskrifter og brødtekst |
| Sekundær tekst | Grå #6E6E73 | Undertekster, betingelser, status |
| Accent | Terrakotta #B5543B | Knapper, links, den ene vigtige ting på hver skærm |
| Streger | #D2D2D7, 1 px | Skillelinjer, lange kanter |

Reglen er én accent pr. skærm. Knappen er accentfarvet, alt andet er sort, gråt eller hvidt. Ingen gradienter, ingen skygger ud over en meget svag på kort, ingen ikoner der ikke har en funktion. Hjørner afrundes 12 px på kort og 980 px (pille) på knapper. Accentfarven er terrakotta. Besluttet.

**Typografi og tone**

- Skrift: systemfont (SF Pro på Apple, Inter som fallback på web). Ingen købt font, ingen serif.
- Størrelser: hero 56 px tight letterspacing (-0.02 em), overskrifter 32 px, brødtekst 17 px, undertekster 14 px. Få størrelser, stor forskel mellem dem.
- Luft: sektioner med 120 px afstand på desktop, 64 px på mobil. Max tekstbredde 640 px. Hellere én sætning med luft omkring end tre uden.
- Bevægelse: kun fade og en let opadglidning når sektioner kommer ind. Under 300 ms. Ingen bounce, ingen spinner.
- Tone: korte sætninger, aktiv form, ingen udråbstegn, ingen tankestreger. Konkrete tal: "100 kr.", "under 10 sekunder". Overskrifter skal kunne stå alene, fx "Dine kunder anbefaler dig allerede."
- Ordvalg: ambassadør, ny kunde, henvisning, belønning. Aldrig "referral", "lead" eller "program".

**Forsiden alius.dk/henvisninger**

1. Hero: "Dine kunder anbefaler dig allerede. Nu får du noget ud af det." Én knap: Opret din butik gratis.
2. Flowet i tre billeder: kunde deler kode, ven booker, begge får belønning. Hvert billede er en telefon med kundesiden.
3. "Virker ved siden af dit booking-system": Planway, Bookio, Treatwell. Ingen integration nødvendig.
4. Hvad frisøren ser: skærmbillede af dashboard-fanen.
5. Pris: samme tre linjer som Stemplet. Gratis op til 100 kortholdere, Pro 99 kr./md.
6. Én case når den findes. Indtil da: regneeksempel. 20 ambassadører, 2 henvisninger hver om året, 40 nye kunder.

**Kundesiden (butikkens farver)**

- Mobil først. Hele siden på én skærm uden scroll: butikkens logo, én overskrift, to felter, én knap.
- Tilstanden styres af URL'en. Uden kode: "Henvis en ven". Med kode: "\[Navn\] har givet dig \[belønning\]".
- Efter oprettelse: koden stor og tydelig, delingsknap øverst, "Tilføj til Wallet" under. Delingsknappen bruger Web Share API, så den åbner SMS eller Messenger direkte.

**Wallet-kortet**

- Samme kort som Stemplet, samme logoText og backgroundColor pr. butik, så kortene stakker rigtigt.
- Forsiden viser: butik, kundens navn, henvisningskode, "2 venner henvist, 100 kr. til gode". Har butikken begge moduler, vises stempelgitteret øverst og henvisningslinjen under.
- Bagsiden: delingslink, betingelser i én linje, link til kundesiden.
- Poster Generic-layout til iOS 27 med Generic som fallback, samme plan som Stemplet.

**Dashboardet**

- Faner i toppen: Stempler (grøn) og Henvisninger (terrakotta). Butikker med ét modul ser én fane.
- Tre nøgletal som kort øverst, derefter listen. Knapperne "Gennemført" og "Indløst" direkte i rækken, ikke bag en menu.
- Kassepanelet på mobil: én søgelinje, scan-knap, resultatkort med de to handlinger som store knapper nederst på skærmen.

## Byggeplan og prompts til Claude Code

Fem faser, hver sin prompt, hver sin PR. Rækkefølgen er valgt så det kan testes i en rigtig salon efter fase 3, før forsiden og Wallet er færdige. Rollefordeling: dette dokument er den strategiske ramme, Claude Code bygger. Hver prompt starter med at Code læser dette dokument (læg det i repoet som `docs/henvisninger.md`) og den eksisterende Stemplet-kode, før den skriver noget.

| Fase | Leverance | Kan testes ved |
| --- | --- | --- |
| 1 | Datamodel, migrations, tilstandsmaskine, tests | Unit- og integrationstests grønne i CI |
| 2 | Kundeside med to tilstande, kode-generering, delingsknap | Opret to kunder via link på en testbutik |
| 3 | Kassepanel og dashboard-fane | En rigtig salon kører det i 2 uger uden Wallet |
| 4 | Wallet-kort med henvisning, push-opdateringer | Kortet opdateres på to telefoner når kassen trykker |
| 5 | Forside alius.dk/henvisninger, onboarding med modulvalg | Første fremmede butik opretter sig selv |

**Prompt til fase 1: datamodel og tilstandsmaskine**

```markdown
Læs docs/henvisninger.md, afsnittene Arkitektur og Datamodel. Læs derefter den eksisterende Stemplet-kode for business, card og stamp, inkl. stamp-pathen med advisory locks og idempotency keys.

Opret branchen henvisninger fra main og arbejd kun der. Alle fem faser lander på den branch, én PR pr. fase mod henvisninger, og henvisninger merges til main først når fase 3 er testet i en rigtig salon.

Byg henvisningsmodulet i samme kodebase:
1. Migrations: referrals_enabled på business, referral_code og referred_by_card_id på card, nye tabeller referral_rule, referral og reward, præcis som i dokumentet.
2. En tilstandsmaskine for referral (created, visited, rewarded, expired, voided) i ét modul. Overgangen created → visited → rewarded sker i én transaktion og bruger samme lock- og idempotency-mønster som stempling.
3. Regler i kode: ét referred_by pr. kort, ingen selvhenvisning, loft tælles på rewarded, udløb via det eksisterende daglige cron-job.
4. Kodegenerering: NAVN-XX, unik pr. butik, uden forvekslelige tegn (0/O, 1/I).
5. Tests i samme stil som de eksisterende: unit for tilstandsmaskinen og reglerne, integration mod Postgres for transaktionen og dobbelttryk.

Ingen UI i denne fase. Lav én PR. Skriv i PR-beskrivelsen hvad du valgte anderledes end dokumentet og hvorfor.
```

**Prompt til fase 2: kundesiden**

```markdown
Læs docs/henvisninger.md, afsnittene Flows og Visuel stil. Læs den eksisterende QR-landingsside for Stemplet og genbrug komponenter, layout og butiksfarver.

Byg kundesiden /henvisninger/[butik] med to tilstande styret af query-parameteren k:
- Uden k: "Henvis en ven og få [belønning]". Navn og mobil, én knap. Efter oprettelse: kode stort, delingsknap (Web Share API med fallback til kopiér), Tilføj til Wallet.
- Med k: "[Henviser] har givet dig [belønning] hos [butik]". Samme felter. Efter oprettelse: velkomstkort, Tilføj til Wallet, Book tid (butikkens booking-link), og nederst egen kode til at henvise videre.
- Et lille kodefelt nederst i tilstanden uden k, til dem der fik koden mundtligt.

Mobil først, hele siden uden scroll på en iPhone. Belønningstekster hentes fra referral_rule. Ugyldig eller udløbet kode: vis siden uden k med en venlig linje, ikke en fejlside.
```

**Prompt til fase 3: kassepanel og dashboard**

```markdown
Læs docs/henvisninger.md, afsnittene Flows og Visuel stil. Læs det eksisterende kassepanel og dashboard for Stemplet.

1. Kassepanel: tilføj søgning på navn, mobil eller kode ved siden af scan. Resultatkortet viser åbne henvisninger og belønninger til gode. To store knapper nederst: "Første besøg gennemført" og "Belønning indløst". Begge kalder tilstandsmaskinen fra fase 1 med staff-id og idempotency key. Bekræft med én linje, ingen modal.
2. Dashboard: ny fane Henvisninger med terrakotta som fanefarve (#B5543B). Tre nøgletal øverst, liste over henvisninger med de to knapper i rækken, top-ambassadører, CSV-eksport. Butikker uden referrals_enabled ser ikke fanen; butikker uden stamps_enabled ser ikke Stempler-fanen.
3. Superadmin: henvisningstal pr. butik i den eksisterende oversigt.

Ingen Wallet-ændringer endnu. Alt skal virke for en kunde der kun findes i databasen.
```

**Prompt til fase 4: Wallet**

```markdown
Læs docs/henvisninger.md, afsnittet Visuel stil, Wallet-kortet. Læs den eksisterende Wallet-generering for Apple og Google, inkl. stempelgitteret, push-opdateringer og Poster Generic-planen.

Udvid det eksisterende kort, lav ikke et nyt:
- Forsiden viser henvisningskode og linjen "[n] venner henvist, [beløb] til gode" når referrals_enabled. Har butikken begge moduler, stempelgitter øverst og henvisningslinje under.
- Bagsiden: delingslink med koden, betingelseslinjen fra referral_rule, link til kundesiden.
- Push-opdatering til begge kort når en referral går til rewarded, og når en reward indløses.
- Samme logoText og backgroundColor-regler som i dag, så kortene stakker korrekt.

Test på en rigtig iPhone og en Android før PR.
```

**Prompt til fase 5: forside og onboarding**

```markdown
Læs docs/henvisninger.md, afsnittene Hvad vi bygger og Visuel stil, Forsiden. Læs alius.dk's eksisterende sider og komponentbibliotek, og stemplet.dk's forside.

1. Byg alius.dk/henvisninger med de seks sektioner i dokumentet. Følg paletten og typografien i dokumentet: hvidt rum, systemfont, én accentfarve, ingen dekoration. Tænk Apple, ikke SaaS-skabelon. Skærmbilleder af kundesiden og dashboardet, ikke illustrationer. Tone: korte sætninger, konkrete tal, ingen udråbstegn, ingen tankestreger.
2. Udvid onboardingen med et modulvalg (Stempelkort, Henvisninger, begge) og et trin til belønningsregler, der skriver til referral_rule. Under 5 minutter fra start til QR-PDF.
3. Tilføj Henvisninger under Produkter i alius.dk's navigation, ved siden af Stemplet.

SEO: title og meta-description på dansk, målrettet "henvisningsprogram frisør" og "få flere kunder frisør".
```

**Når faserne er bygget**

- [ ] Første pilot: én frisør i København, gratis i 3 måneder mod feedback hver 14. dag
- [ ] Køb henvisninger.dk og sæt redirect op til alius.dk/henvisninger
- [ ] Afgør om henviserens belønning kan være stempler i Stemplet (binder produkterne sammen)
- [ ] Første case på forsiden efter 3 måneders pilot
