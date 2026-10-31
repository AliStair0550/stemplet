# Roadmap og backlog

Opdateret 31. oktober 2026. Ét sted for, hvad der er bygget, hvad der kommer, og hvad der venter på en beslutning. Detaljer om robusthed står i [robusthed-2026-10-31.md](robusthed-2026-10-31.md).

## Bygget (seneste)

- **Testrunden 30. oktober**, alle punkter A til F (PR #69 til #77):
  - Knapper der holder deres tekst, mails uden hvid kasse og uden login-kode ved oprettelse.
  - Et tryk til Wallet, alle ikoner ved oprettelse, og flere butikker kun for admin.
  - Plakaten: farver, eget billede, gemmes og krydses af under Kom i gang.
  - Kassen: tydelig kvittering, klar fortryd og "hvem får hvad" ved henvisning.
  - Henvisning gennem kortet uden kode: del-knap, antal henviste og Book tid.
  - Folka-ikon overalt, pushbeskeden kan findes under Tilbud og fordele, og farver med eget billede er forklaret.
  - Kom i gang om design, rabat og deling, "Del kortet" på Hjem og altid et næste skridt.
  - Kundeoverblik med tal og filtre, og belønningshistorik på Hjem.
  - Kommunikation på telefon og fejring, når en pushbesked er sendt.
  - Ret tilbud, https automatisk og tilbud som pushbesked.
- Før testrunden: pushbeskeder via Wallet, Tilbud og fordele, én kasse til stempler og henvisninger, oprettelse med moduler, butikkens eget ikon ved notifikationer, QR i fuld skærm og i Wallet.

## Nu: robusthed (før flere butikker)

Fra gennemgangen 31. oktober. Ingen P0, men Wallet-udsendelse og databaseforbindelser er det første, der knækker ved vækst.

1. **Bølge 1, små og sikre (færdig 31. okt, #79 og del 2):**
   - R1: Apple-fejl må ikke slette registreringer.
   - R2: tidsgrænser på Wallet.
   - R5: dobbelttryk på Hent kort.
   - R6: loft på gendan-mails.
   - R7: fejl til Sentry.
   - R11/R12: tidsgrænser på Redis, Resend og logo.
   - R14: cron fortsætter ved fejl, og vi får besked, hvis den stopper.
   - R15: deploy prøver igen, når Neon sover.
   - R18 og R20, samt længdegrænser.
2. **Bølge 2, vækst (lavet 31. okt, undtagen R22 og genoptagelse af afbrudte udsendelser):**
   - R3: hent ikke billeder ved hvert stempel.
   - R2: én delt forbindelse til Apple, samling af hurtige Gem og genoptagelse af afbrudte udsendelser.
   - R13: nyt forsøg ved midlertidige Apple-fejl.
   - R22: 304 til Apple.
   - R9: logoer genkodes.
   - R21: build og skema-tjek i CI.
   - Den tunge statistik, der løber tør for forbindelser.
3. **Bølge 3, datamodel (R10, R17 og R19 lavet 31. okt; API-hash og Blob udskudt):**
   - R10: dobbelttryk-lås i databasen for stempler.
   - R17: mails sendes kun én gang.
   - R19: slettet henviser.
   - API-nøgle som hash.
   - Billeder til Vercel Blob.

## Nu: robusthed, runde 2

Fra gennemgangen 31. oktober, se [robusthed-2-2026-10-31.md](robusthed-2-2026-10-31.md). Ingen P0. Seks P1: konto-kapring ved oprettelse, login når databasen sover, login-mail uden tidsgrænse, "Prøv igen" på fejlsider, faktura-markeringer fra den gamle pris og spam via offentlige formularer. Foreslået som bølge A (små) og bølge B (en dag hver) plus fem beslutninger.

Polering af ejerens oplevelse på mobil går forud for nye produktfunktioner.

## Næste: produkt

I anbefalet rækkefølge:

1. **Pushbesked når kortet er fuldt:** "Din belønning er klar. Vis kortet ved kassen." Én gang, når sidste stempel gives.
2. **Kundefeedback på Tilbud og fordele:** stjerner eller smiley og tekst. Fane under Kommunikation, mail til butikken, og glade kunder sendes videre til en Google-anmeldelse. Kræver ny tabel og en linje i privatlivspolitikken.
3. **Nyhedsmails:**
   - Kun til kunder med samtykke.
   - Skabeloner, afmeldingslink, målgrupper og statistik.
   - Kunden skal kunne trække samtykket tilbage.
4. **Automatik:**
   - "Vi savner dig", "1 stempel mangler", fødselsdag og milepæle.
   - Fundamentet er klar: livstidsstempler, stempellog, push og ændringsbesked.
5. **Google Wallet.**
6. **Point og niveauer:** point pr. 100 kr. med katalog, VIP-niveauer, klippe- og gavekort.
7. **Kæder, kassesystem-integrationer og betaling** (Stripe eller manuel faktura, se beslutninger).

## Backlog (mindre punkter)

- **Del kortet:** ét samlet sted i menuen (QR, link, plakat, visitkort). De andre steder får kun et lille link dertil.
- **Henvisningslink:** gå direkte til butikken via server-redirect, med delingsbillede til link-forhåndsvisning.
- **Fejring:** fejr butikkens første stempel.
- **Design og Regler:**
  - Flyt "Kortets navn" fra Regler til Design.
  - Advar, når en ændring under Design eller Regler opdaterer alle kort (hænger sammen med R2).
  - Når antal stempler hæves: vis ejeren, at kunder med fuldt kort nu skal samle de ekstra stempler (R16).
- **Kundesiden:**
  - Delingsbillede (OG) til forsiden.
  - Personlig deleside fra Wallet-knappen uden cookie.
  - Velkomstmail "Dit kort" til kunden.
- **Kassen:**
  - Flyt et kort fra kassen.
  - Loft på enheder pr. parringskode, og besked til ejeren ved ny kasse.
- **Tilbud:** partnere bekræfter rabatten ved kassen.
- **Plakaten:** flere skabeloner.
- **Wallet:** WALLET_POSTER i produktion efter test på iPhone.
- **Sikkerhed og privatliv:**
  - SSRF-hærdning af logo- og webhook-hentning.
  - Neutralt svar ved tilmelding, hvis e-mailen allerede har kort.
- **Data og ydelse:**
  - Ryd overflødige indeks og den dobbelte AuditLog pr. stempel.
  - Mindre CSS pr. side.
- **Pushbeskeder:**
  - Målgrupper og planlægning.
  - Kunder-filtre (i Wallet, fravalgt).
- **Backup (når der er betalende butikker):** ugentlig krypteret kopi af databasen via GitHub Actions, gemt i 8 uger, én prøve-gendannelse, og skift til betalt plan hos Neon med længere historik (R8).
- **Demo-butikken:** ret logoet (data, under Design).

## Besluttet

- **Flere stempler på kortet (R16), 31. okt:** kunden beholder sine stempler og skal samle de ekstra for at få belønningen (fx 10 af 12). Sådan virker koden allerede, så der skal intet ændres.
- **Stempler som henvisningsbelønning (R4), 31. okt:** bygges ikke nu. Valget bliver, og personalet giver stemplerne i hånden ved kassen. Kassen siger nu "Giv 3 stempler" i stedet for "indløst", så ingen tror, at de er givet automatisk.
- **Backup (R8), 31. okt:** vi bliver på gratisplanen hos Neon og venter med egen backup. Tages op igen, når systemet kører med betalende butikker (se backloggen).

- **Betaling, 31. okt:** Stripe er fjernet fra koden (og grænsen for antal kunder og "Drevet af"-mærket, som var slået fra). Manuel faktura indtil videre. Betaling tages op forfra, når det bliver aktuelt (ca. januar 2027).

## Beslutninger hos Ali

| Emne | Spørgsmål |
|---|---|
| Roller | Ejer og ansat med forskellige rettigheder (i dag kan alle medlemmer alt, også fjerne ejeren). |
| Juridisk | CVR, juridisk navn og advokatgennemgang (privatlivspolitikken nævner ikke push). |
