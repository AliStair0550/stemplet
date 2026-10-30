# Gennemgang af side og app, 30. oktober 2026

Målet: man ved altid, hvad man skal. Færre ord, det visuelle taler. Små sejre fejres. Hurtigt og skarpt fra første besøg.

Fire gennemgange: kundens rejse (/k, Wallet, /fordele), butikkens dashboard, forside/oprettelse/login og hastighed/kvalitet.

Mærkning: **[SIKKER]** = ren tekst, design eller ydelse uden ændret adfærd, laves med det samme. **[GODKEND]** = ændrer adfærd, data, env eller flytter sider, kræver dit ja.

## Overblik

| Område | P1 | P2 | P3 |
|---|---|---|---|
| Kunden (/k, Wallet, /fordele) | 6 | 12 | 6 |
| Dashboard | 10 | 17 | 7 |
| Forside, oprettelse, login | 10 | 15 | 5 |
| Hastighed og kvalitet | 6 | 10 | 9 |

Ingen fejl, der stopper driften. De største huller er gammelt navn og gammel pris på sider, der stadig er i luften, manglende fejring af de vigtigste øjeblikke og en database-pulje på én forbindelse.

## P1: skal rettes

### Navn og pris (gammelt indhold i luften)
1. /stemplet viser stadig "Dine første 100 kunder er gratis" og hele det gamle Stemplet-site. **[SIKKER]** ret prisen nu. **[GODKEND]** 301 /stemplet → /.
2. "Drevet af Stemplet" på kundens kort (StampCard). **[SIKKER]** → "Drevet af Folka".
3. Branchesider, gammel Nav/Footer, e-mails, login og fanetitler siger "Stemplet" eller "Kundekort" som navn. **[SIKKER]** → Folka Kort.
4. Velkomstmailen nævner "det andet produkt". **[SIKKER]** → "Slå henvisninger til under Regler".
5. Forsiden lover "Belønninger frigives kun med personalets PIN", men PIN er slået fra som standard. **[SIKKER]** omskriv.

### Kundens rejse
6. Kvitteringen efter "Tilføj til Wallet" er svær at læse og fejrer ikke. **[SIKKER]** butikkens farver, konfetti, "Kortet er i din Wallet."
7. Fuldt kort fejres ikke på /fordele. **[SIKKER]**
8. Ét tryk fra formular til Wallet (POST der returnerer kortet direkte). **[GODKEND]**
9. Besked på låseskærmen, når kortet er fuldt. **[GODKEND]**
10. Henvisningslink: server-redirect for mennesker i stedet for mellemside. **[GODKEND]**

### Dashboard
11. Gem-knappen under Design og Regler gemmer sig bag fanebaren på mobil. **[SIKKER]**
12. Kampagner siger "del på Instagram", Stempler siger lad være. **[SIKKER]** én besked.
13. Kom i gang-trinene krydses aldrig af og forsvinder uden ord. **[SIKKER]** 0/3, fremdriftsbjælke, flueben fra data, fejring ved første kunde.
14. Trin 3 "Prøv det selv" siger ikke hvordan. **[SIKKER]**
15. Fuldt kort i kassen fejres med en lille tekstlinje. **[SIKKER]** konfetti og stor "Kortet er fuldt".
16. Kunder uden kunder: blindgyde. **[SIKKER]** tom-tilstand med "Vis QR-kode".
17. Nyhedsmail-fanen åbner en "under udarbejdelse"-side. **[SIKKER]** vis "Snart" uden link.
18. Delingen ligger otte steder. **[GODKEND]** ét sted: "Del kortet" (QR, link, plakat, visitkort).
19. Ny butik nr. 2 lander på den gamle kom-i-gang-side. **[GODKEND]** send til /app.

### Forside og oprettelse
20. /prøv er i det gamle look og har ingen vej videre til oprettelse. **[SIKKER]** knap "Opret dit eget kort".
21. Historien på mobil dæmper det kapitel, man læser. **[SIKKER]**
22. Uskarpt lys (blur 70px) på animerede flader tynger iPhone. **[SIKKER]** fjern filteret.
23. Oprettelsen: forkert farve i forhåndsvisning, ingen forhåndsvisning på mobil, gammel tekst ("Gratis. Intet kreditkort."). **[SIKKER]**

### Hastighed
24. Databasepuljen er 1 forbindelse, så alt parallelt køres i kø. **[GODKEND]** env-ændring til 5.
25. Statuskaldet på /k laver 2 databaseskrivninger til rate limit og kaldes op til 26 gange pr. besøg. **[SIKKER]** Redis-først rate limit og delt kald. **[GODKEND]** let wallet-poll.
26. Anomali-tjek ved stempel venter på 8 Redis-kald før svar. **[SIKKER]** efter svaret, i én pipeline.
27. Push til alle kort åbner én APNs-forbindelse pr. kort. **[SIKKER]** delt forbindelse.
28. Wallet-opdatering ignorerer "siden sidst" og bygger alle kort igen. **[GODKEND]** kræver migration.

## P2: bør rettes (udvalg)

- Kassen: tre ens "Færdig"-knapper, 30 ords Wallet-note ved hvert scan, to PIN-felter. **[SIKKER]**
- Fejr første stempel og første push. **[SIKKER]** for push; **[GODKEND]** for stempel-API.
- Hjem: rækker af nuller for ny butik, uklart "nye kortholdere", tom "Klar til belønning". **[SIKKER]**
- Statistik tom for ny butik: én linje i stedet for 8 nul-felter. **[SIKKER]**
- "I/jer" → du-form i overbliksteksterne. **[SIKKER]**
- Lange undertekster på Push, Tilbud, Visitkort. **[SIKKER]**
- Indstillinger: "Gratis-planen" og "Audit log". **[SIKKER]**
- Forsiden: "Log ind" mangler på mobil, sidste CTA er prøvekort frem for oprettelse, "ekskl. moms" mangler, "intet kort på forhånd" er forvirrende. **[SIKKER]**
- Dobbelte SVG-id'er på forsiden kan give tomme kort på mobil. **[SIKKER]**
- Hent fuld butiksrække (logo og billeder) ved hvert dashboard-kald og ved hvert stempel. **[SIKKER]**
- /hvorfor og /henvisninger (landingsside) er gamle. **[GODKEND]** 301.
- Fjern navnefeltet i oprettelsen. **[GODKEND]**

## P3: nice to have (udvalg)

- Ryd ubrugte filer i public (ca. 1 MB) og døde komponenter. **[SIKKER]**
- Oprydning i SendThrottle via daglig cron. **[SIKKER]**
- Overflødige indeks og dobbelt audit-række pr. stempel. **[GODKEND]**
- JSON-LD på forsiden med Folka Kort og 49 kr. **[SIKKER]**
- Skærmlæser: navngivne kontakter, dobbeltlæst brancheliste. **[SIKKER]**

## Rækkefølge

1. Navn og pris overalt (risiko nul, største troværdighedsgevinst).
2. Fejring og "hvad skal jeg nu" (kvittering, kom i gang, kasse, tomme tilstande).
3. Mobil: gem-knapper, forhåndsvisning i oprettelsen, historien.
4. Hastighed uden adfærdsændring.
5. Dine godkendelser (punkt 1, 8, 9, 10, 18, 19, 24, 25, 28).
