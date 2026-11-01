# Roadmap

Opdateret 1. november 2026. Ét sted for, hvad der kommer, og hvad der er besluttet. Udseendet er låst i [DESIGN.md](../DESIGN.md). Gamle gennemgange og testrunder ligger i [arkiv/](arkiv/).

## Status

Folka Kort er live på kort.folka.dk. Fokus er at polere det, vi har, især ejerens oplevelse på telefonen, før nye produktfunktioner.

**Senest bygget (1. nov):**
- Medarbejdere med eget login.
- Første stempel ved hentning og kundens navn på kortet.
- Kom i gang med seks trin og en fejring.
- Tidsbegrænsede tilbud med nedtælling.
- Forsiden med et hjul af kort.
- Designet er låst, og gamle Stemplet-sider og -filer er ryddet op.

## Næste

1. **Besked, når kortet er fuldt:** "Din belønning er klar. Vis kortet ved kassen." Én gang, ved sidste stempel.
2. **Kundefeedback** på Tilbud og fordele: stjerner eller smiley og tekst. Glade kunder sendes videre til en Google-anmeldelse.
3. **Nyhedsmails** til kunder med samtykke: skabeloner, afmelding og målgrupper.
4. **Automatik:** "Vi savner dig", "1 stempel mangler", fødselsdag og milepæle. Fundamentet er klar.
5. **Google Wallet.**
6. **Point og niveauer:** point pr. 100 kr., VIP-niveauer, klippe- og gavekort.
7. **Kæder, kassesystemer og betaling.**

## Robusthed

Bølge 1 til 3 fra 31. oktober er lavet. Tilbage:
- API-nøgle som hash.
- Billeder til Vercel Blob.
- Genoptagelse af afbrudte Wallet-udsendelser.
- Runde 2 (seks P1, se [arkiv](arkiv/robusthed-2-2026-10-31.md)): konto-kapring ved oprettelse, login når databasen sover, login-mail uden tidsgrænse, "Prøv igen" på fejlsider, gamle faktura-markeringer og spam via formularer.

## Backlog

- **Kundesiden:**
  - Når en kunde scanner igen, viser kortet 0 stempler i stedet for kundens rigtige antal.
  - Delingsbillede til forsiden.
  - Velkomstmail "Dit kort" til kunden.
- **Branchesiderne:** nye tegninger uden det gamle Stemplet-skilt.
- **Design og Regler:**
  - Flyt "Kortets navn" til Design.
  - Advar, når en ændring opdaterer alle kort.
  - Vis konsekvensen, når antal stempler hæves.
- **Kassen:**
  - Flyt et kort.
  - Loft på kasser pr. kode, og besked til ejeren ved en ny kasse.
- **Tilbud:** partnere bekræfter rabatten ved kassen.
- **Plakaten:** flere skabeloner.
- **Wallet:** iOS 27-kortet (WALLET_POSTER) i produktion efter test på iPhone.
- **Sikkerhed:**
  - SSRF-hærdning af logo- og webhook-hentning.
  - Neutralt svar, hvis e-mailen allerede har et kort.
- **Data:** ryd overflødige indeks og den dobbelte hændelseslog pr. stempel.
- **Backup**, når der er betalende butikker: ugentlig krypteret kopi og en betalt plan hos Neon.

## Besluttet

- **Flere butikker under ét brand:** bygges, når den første kæde spørger efter det. Indtil da er én butik én konto (`Stamp.locationId` findes allerede).
- **Slettet kunde i Wallet:** bygges ikke. Kortet bliver liggende i kundens Wallet, men kassen afviser det, og kunden får en mail. Det sker sjældent.
- **Opdatering af alle Wallet-kort efter #116:** ikke sendt. Kortene får navn og nyt link ved næste stempel.
- **Betaling:** manuel faktura. Stripe er fjernet og tages op igen omkring januar 2027.
- **Backup:** vi venter, til der er betalende butikker.
- **Flere stempler på kortet:** kunden beholder sine stempler og samler de ekstra.
- **Stempler som henvisningsbelønning:** gives i hånden ved kassen.
- **Roller:** bygget. "Kun kassen" eller "Adgang til alt", altid mindst én med adgang til alt.

## Hos Ali

- **Juridisk:** CVR, juridisk navn og advokatgennemgang af privatlivspolitikken.
