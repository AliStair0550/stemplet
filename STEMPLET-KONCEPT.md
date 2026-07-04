# STEMPLET
## Det digitale stempelkort. Bygget af Alius.

Tagline: **Stempelkortet, der aldrig bliver væk.**

Undertekst: Dine kunder scanner en QR-kode og har dit stempelkort i Apple Wallet på fem sekunder. Ingen app. Ingen tilmelding. Ingen kort, der bliver væk.

---

## 1. Produktet i én sætning

Stemplet erstatter det fysiske stempelkort med et digitalt kort i kundens Apple Wallet, styret af virksomheden gennem et enkelt dashboard, solgt som stand-alone produkt under Alius.

## 2. Målgruppe

Små fysiske forretninger, der i dag bruger papkort og håndstempler:

- Caféer og kaffebarer
- Barberer og frisører
- Bagere og takeaway
- Neglesaloner og skønhedsklinikker
- Vaskehaller, blomsterbutikker, juicebarer

Deres smerter, som Stemplet løser direkte:

| Fysisk kort | Stemplet |
|---|---|
| Kortet bliver væk i lommen | Ligger i Wallet, altid ved hånden |
| Alle med et stempel kan snyde | Kryptografisk signerede stempler, ingen kan snyde |
| Nul viden om kunderne | Statistik på genbesøg, stempler og indløsninger |
| Trykkeri, ventetid, spild | Live om 10 minutter, ændringer med det samme |
| Glemte kort = glemte kunder | Passet minder kunden om dig, hver gang de åbner Wallet |

## 3. Navn og brand

**Stemplet** (bestemt form, dansk, ejer kategorien). Kort, konkret, umuligt at misforstå.

- URL: `alius.dk/stemplet` som marketing-indgang, appen kører på `stemplet.alius.dk` (eller stemplet.dk hvis ledigt).
- Visuelt: Alius' designsprog. Samme typografi, samme ro, samme præcision. Stemplet er et Alius-produkt og skal føles som en naturlig forlængelse af alius.dk.
- Signaturelement: et levende stempelkort. På marketing-siden stemples et kort trin for trin, mens man scroller. Det er produktdemoen og hero i ét.
- Tone of voice: kort, direkte, hverdagsdansk. Ingen udråbstegn. Ingen lange tankestreger. Vi sælger ro og enkelhed, ikke hype.

Eksempler på copy-stil:

> Dine kunder har allerede telefonen i hånden. Nu har de også dit stempelkort.

> Ni ud af ti fysiske stempelkort bliver aldrig fyldt. De bliver væk først.

> Kom i gang gratis. Det tager ti minutter. Du skal ikke engang bruge et kreditkort.

## 4. Pris

Så billigt, at man ikke kan lade være. Gratis at komme i gang, ingen binding, intet kort ved oprettelse.

| | **Gratis** | **Pro, 99 kr./md.** |
|---|---|---|
| Stempelkort | 1 | Ubegrænset |
| Aktive kunder | 50 | Ubegrænset |
| Apple Wallet | Ja | Ja |
| Eget logo og farver | Ja | Ja |
| "Drevet af Stemplet" på kortet | Ja | Fjernes |
| Statistik | Basis | Fuld |
| Kampagner (dobbeltstempel m.m.) | Nej | Ja |
| Flere lokationer | Nej | Ja |

Prislogik: Gratis-planen er reelt brugbar, så barrieren er nul. 99 kr. er mindre end én genkøbt kunde om måneden. Det argument står direkte på siden.

## 5. Kundens oplevelse (skal føles som Apple)

1. Kunden ser et skilt ved kassen: "Scan og få dit stempelkort."
2. Scanner QR med kameraet. Ingen app-download.
3. Ser virksomhedens brandede side med ét stort valg: **Læg i Apple Wallet**.
4. Kortet ligger i Wallet med virksomhedens logo, farver og stempelstatus.
5. Ved køb får kunden et stempel på under tre sekunder (se sikkerhed).
6. Fuldt kort: passet skifter til "Belønning klar" og vises automatisk på låseskærmen, når kunden er i butikken (lokationsbaseret pass-relevans).
7. Belønningen indløses ved kassen, kortet nulstilles automatisk til en ny runde.

Android og fallback: et webkort med egen unik URL, der kan føjes til hjemmeskærmen. Samme funktioner, samme design. Google Wallet tilføjes senere.

## 6. Virksomhedens oplevelse (dashboardet)

Ét dashboard, fem områder. Alt kan sættes op på ti minutter.

**Kort og design**
- Antal stempler (4 til 12)
- Belønningstekst ("10. klip er gratis")
- Logo-upload, farver hentes automatisk fra logoet og kan justeres
- Valg af stempel-ikon (kaffekop, saks, croissant, hjerte, eget ikon)
- Live preview af Wallet-passet, mens man designer

**Kassen (stempling)**
- Kassemodus: fuldskærmsvisning med roterende stempel-QR til kundens kamera
- Scan-modus: personalet scanner kundens kort med butikkens telefon
- Indløsning af belønning med personale-PIN

**Kampagner** (Pro)
- Dobbeltstempel-dage
- Bonusstempel ved første besøg
- Tidsbegrænsede kampagner med start og slut

**Statistik**
- Aktive kunder, nye kunder, stempler pr. dag og uge
- Indløsninger og gennemførelsesrate
- Genbesøgsrate og tid til fuldt kort
- Eksport som CSV

**Indstillinger og sikkerhed**
- Personale-PIN
- Stempel-interval (standard: maks. 1 stempel pr. kunde pr. 2 timer)
- Audit log over alle stempler og indløsninger
- Print-klar QR-plakat og disk-skilt som PDF, i virksomhedens design

## 7. Sikkerhed, så ingen kan snyde

Grundprincip: **et stempel kan kun opstå på serveren**, aldrig på kundens telefon.

1. **Signerede engangs-tokens.** Stempel-QR'en i kassemodus indeholder et signeret token, der udløber efter 60 sekunder og kun kan bruges én gang. Brugte token-id'er gemmes, replay er umuligt.
2. **Roterende QR.** Koden på butiksskærmen skifter hvert 60. sekund. Et foto af skærmen er værdiløst et minut senere.
3. **Rate limit pr. kunde.** Maks. ét stempel pr. kunde pr. butik i et konfigurerbart interval. Man kan ikke scanne fem gange i køen.
4. **Enhedsbinding.** Hvert kort er bundet til en unik serial og et enhedstoken. Kortet kan ikke kopieres til en anden telefon og bruges dobbelt.
5. **Personale-PIN ved indløsning.** En belønning kan kun indløses, når personalet bekræfter. Kunden kan ikke selv trykke "indløs" derhjemme.
6. **Audit log og anomali-flag.** Alt logges med tidspunkt, metode og enhed. Mange stempler fra samme enhed eller IP flages automatisk i dashboardet.
7. **Kassemodus er bundet til butikkens enhed.** Kassemodus kræver login og udstedes til en registreret enhed. En kunde kan ikke selv åbne kassemodus.

Dette er også et salgsargument. Fysiske stempelkort kan alle snyde med. Stemplet kan ingen.

## 8. Apple Wallet, teknisk kort fortalt

- Passet er et PassKit storeCard (.pkpass), signeret med virksomhedscertifikat fra din Apple Developer-konto (Pass Type ID).
- Passet opdaterer sig selv. Når kunden får et stempel, sender serveren et push via APNs, og Wallet henter det opdaterede pas. Kunden ser stemplet lande på kortet med det samme.
- Lokationsrelevans: passet kan vise sig på låseskærmen, når kunden er nær butikken.
- Indtil din Apple Developer-konto er klar, kører alt bag et feature flag. Webkortet er fuldt funktionelt fra dag ét, så produktet kan sælges og bruges nu. Wallet slås til med én miljøvariabel, når certifikatet er på plads.

## 9. Salg gennem Alius

- Stemplet tilføjes på alius.dk som produkt, med link fra forsiden.
- Hvert kundekort på Gratis-planen bærer "Drevet af Stemplet". Hver kunde bliver et lille skilt for produktet.
- Naturligt mersalg: Stemplet-kunder er præcis de virksomheder, der også køber brand og hjemmeside hos Alius. Stemplet er den billigste vej ind i kundeforholdet.
- Oplagte første kunder fra din egen portefølje: SSTUDIO, Smashii, Cafe Christian IX, Brazakz og Cykelmov.

## 10. Roadmap efter lancering

1. Google Wallet
2. Flere lokationer og kæder
3. SMS- eller e-mail-påmindelser ("Du mangler ét stempel")
4. Point-variant som alternativ til stempler
5. Integration til folka, hvor foreninger kan bruge samme motor til medlemsfordele
