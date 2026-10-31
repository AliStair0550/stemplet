# Testrunde 30. oktober 2026

Alis noter fra test med en ven, samlet og prioriteret. Vi tager 2 til 3 punkter ad gangen, tester dem og går videre. Status: Klar til test, I gang, Venter.

## Allerede lavet (PR #68, klar til gentest)

- **Stemplets logo ved pushbeskeder.** Ikonet viser nu butikkens logo eller stempelikon. Skifter først på et kort, når kortet opdateres næste gang (stempel eller pushbesked).
- **Vis QR-kode i fuld skærm** og **butikkens eget QR-kort i Wallet**.
- **Booking-link direkte under Design** (Book tid kan trykkes, og linket indsættes lige under).

## A. Fejl (virker forkert)

| # | Punkt | Status |
|---|---|---|
| A1 | Knaptekst forsvinder eller bliver mørk ved tryk (Skift billede, Tilføj til hjemmeskærm, Rabat givet, Giv stempel) | Lavet (batch 1) |
| A2 | Hvid kasse omkring Folka-logoet i mails | Lavet (batch 1) |
| A3 | Login-kode-mail ved oprettelse, selvom man logges ind automatisk | Lavet (batch 1) |
| A4 | Hent kort: viser "Hent kort" igen og kortet først 3 sekunder efter | Lavet (batch 2) |
| A5 | Vennen ser QR-koden på iPhone efter at have hentet kortet (den tegnede QR i kortets forhåndsvisning er fjernet på kundesiden; ses en rigtig QR igen, så send et skærmbillede) | Lavet (batch 2) |
| A6 | "Se kundekort" på iPhone (app fra hjemmeskærm) mangler en vej tilbage | Lavet (batch 2) |
| A7 | Eget billede + lyse farver: der sker ingenting | Lavet (batch 8) |
| A8 | Hjemmeskærm-ikonet viser det gamle logo, ikke Folka (gammelt ikon på telefonen skal slettes og tilføjes igen) | Lavet (batch 8) |
| A9 | Pushbesked, der ikke ses på låseskærmen, kan ikke findes bagefter | Lavet (batch 8) |

## B. Oprettelse og kom i gang

| # | Punkt | Status |
|---|---|---|
| B1 | Knap til at se alle ikoner ved oprettelse | Lavet (batch 3) |
| B2 | "Opret flere butikker" i toppen kun for admin | Lavet (batch 3) |
| B3 | Eksempel-knapper på Hjem forvirrer (man prøver at trykke på dem) | Lavet (batch 3) |
| B4 | Kom i gang: fokus på design, kundekortet og rabatten; trin 3 = se kortet og del det | Lavet (batch 9) |
| B5 | Stærkere deling på Hjem, så man føler sig klar efter oprettelsen | Lavet (batch 9) |
| B6 | Altid tydeligt næste skridt, så butikken klarer sig uden support | Lavet (batch 9) |

## C. Plakat

| # | Punkt | Status |
|---|---|---|
| C1 | Plakaten bruger det første billede, og det kan ikke ændres | Lavet (batch 5) |
| C2 | "Kortets farve" bruger ikke den rigtige farve | Lavet (batch 4) |
| C3 | Eget billede zoomer for meget på A4/A5 og for lidt på A6 | Lavet (batch 4) |
| C4 | Plakaten kan ikke gemmes (man starter forfra) | Lavet (batch 5) |
| C5 | Kom i gang-trinnet "Hæng QR-koden op" bliver ikke markeret som klaret | Lavet (batch 5) |

## D. Kassen

| # | Punkt | Status |
|---|---|---|
| D1 | Uklart flow ved "Rabat givet" og stempler; man kom til at give 2 stempler og kunne ikke se, hvordan man retter | Lavet (batch 6) |
| D2 | Det føles, som om man skal trykke Færdig, før stemplet gives | Lavet (batch 6) |

## E. Kunden og henvisninger

| # | Punkt | Status |
|---|---|---|
| E1 | Kundesiden: "Har du en kode fra en ven" er ikke relevant; mangler en delingsknap | Lavet (batch 7) |
| E2 | Henvisning skal gå gennem kortet (link, ikke kode). Ingen kode vist, bare "Del" | Lavet (batch 7) |
| E3 | Efter henvisning mangler en call-to-action til booking | Lavet (batch 7) |
| E4 | Tilbud og fordele: vis hvor mange man har henvist | Lavet (batch 7) |

## F. Dashboardet

| # | Punkt | Status |
|---|---|---|
| F1 | Kundeoverblikket skal forbedres | Venter |
| F2 | Belønningshistorik (ud over Klar til belønning) | Venter |
| F3 | Kommunikation er ikke tydelig nok på telefon | Venter |
| F4 | Fejring, når en pushbesked er sendt | Venter |
| F5 | Tilbud: kan ikke redigeres; https skal tilføjes automatisk | Venter |
| F6 | Del et nyt tilbud eller en samarbejdspartner som pushbesked | Venter |
| F7 | Alt optimeret til telefon | Løbende |
