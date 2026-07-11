# Saadan virker stempling i Stemplet

Der er **to maader at give et stempel paa** og **een maade at indloese paa**. Alt
gaar gennem den samme motor (`applyStamp` / `redeemReward` i `src/lib/stamp.ts`).

## Metode A: Kunden scanner butikkens stempel-QR (selvbetjening)

**Hvor:** Dashboard -> Kasse -> Stempel-QR. En kode, der skifter hvert ~60.
sekund, vises paa en skaerm ved disken.

**Hvad koden er:** en URL, `.../s/<token>`. `<token>` er et signeret engangs-token
(JWT) med butiks-id, kort-id og et unikt id (jti), gyldigt i **60 sekunder**.

**Forloeb:**
1. Kunden scanner koden med telefonens kamera og lander paa `/s/<token>`.
2. Siden verificerer tokenet (server) og viser en kvittering. **Selve stemplingen
   sker via klientens POST til `/api/stamp`**, ikke ved sideindlaesningens GET.
   (Det er bevidst: en prefetch fra en messaging-app maa aldrig kunne braende et
   token eller give et stempel.)
3. Systemet finder kundens kort via en cookie paa telefonen, sat foerste gang
   kunden hentede kortet paa `/k/<butik>`.
4. Kunden ser "Stempel 6 af 10" med vibration (og konfetti, hvis kortet blev fuldt).

**Vagtposter:**
- Koden er kun gyldig 60 sekunder, saa et foto af skaermen er vaerdiloest bagefter.
- **Token engangs PR. KORT:** en koe af forskellige kort kan scanne samme skaerm-QR
  inden for dens levetid, men det samme kort kan aldrig bruge samme token to gange.
  (Redis-noegle `stamp:<jti>:<kort>`, plus databasens sammensatte unik
  `[tokenJti, customerCardId]` som backstop.)
- **Cooldown** (standard 120 min, justerbar pr. butik): kundens egen scanning giver
  max eet stempel pr. interval.
- Har kunden ikke et kort endnu, sendes de foerst hen for at oprette det.

Teknisk metode i data: `KIOSK_QR`.

## Metode B: Personalet scanner kundens kort (bemandet kasse)

**Hvor:** Dashboard -> Kasse -> Scan kort. Personalet bruger enhedens kamera.

**Hvad der scannes:** kundens eget kort-QR (fra Wallet/webkortet paa
`/kort/<serienummer>`), som indeholder kortets serienummer.

**Forloeb:**
1. Personalet scanner kortet. Systemet slaar tilstanden op (`/api/staff/card`):
   antal stempler, og om der er en beloenning klar.
2. Personalet trykker "Giv stempel". Kortet taeller op.
3. **Ingen cooldown her.** Personalet staar ved disken og bestemmer, saa 3 kaffe
   = 3 tryk = 3 stempler.

Teknisk metode i data: `STAFF_SCAN` (springer cooldown over).

## Indloesning: altid personale, altid PIN

En kunde kan **aldrig** indloese sig selv. Deres fulde kort siger blot "vis ved
kassen".

1. Naar kortet er fuldt, viser Scan kort-visningen et PIN-felt.
2. Personalet taster personale-PIN og trykker "Indloes beloenning".
3. Kortet **nulstilles til 0**, og `completedCount` taelles +1. En ny runde starter
   paa samme kort.

**Sikkerhed paa PIN'en:** hashet med bcrypt. 3 forkerte forsoeg laaser indloesning
i 5 minutter (noeglet paa IP, med enheds-cookie som fallback). Hvert fejlforsoeg
logges i audit-loggen.

## Den faelles motor (ved hvert stempel, uanset metode)

- Koerer i en database-transaktion.
- Tjekker at kortet er aktivt og ikke allerede fuldt.
- **Kampagner:** dobbeltstempel giver +2, velkomstbonus +1 paa allerfoerste stempel.
- **Atomisk optaelling:** to samtidige stempler paa samme kort giver aldrig tabte
  eller dobbelte stempler.
- Skriver en stempel-post (metode, jti, multiplier) plus en audit-log-linje.
- Efter commit: anomali-tjek, webhook (`stamp.created` / `reward.ready`), og
  Apple Wallet-opdatering (naar slaaet til).

### Anomali-detektion (uden cafe-wifi-stoej)

Gaeste-wifi deler een offentlig IP, saa ren volumen fra een IP mod een butik er
IKKE mistaenkelig. Vi flager derfor:
1. **Kort-niveau:** samme kundekort faar unormalt mange stempler paa en time.
2. **IP-niveau:** KUN naar samme IP rammer mange forskellige kort OG flere
   forskellige butikker (scriptet misbrug). En travl fredag i een cafe flager aldrig.

## Metode C: Det offentlige API (automatisk drift)

`POST /api/v1/stamp` og `/api/v1/redeem` med API-noegle (Bearer). Bruges af
kassesystemer, Zapier o.l. Springer cooldown over (systemet bestemmer selv).

**Haerdning:**
- **Scoping:** en API-noegle hoerer til een virksomhed og kan aldrig roere andre
  virksomheders kort (hvert kald tjekker `cc.card.businessId === business.id`).
- **Rate limiting:** `/api/v1/stamp` 300/min pr. virksomhed, `/api/v1/redeem`
  60/min pr. virksomhed.
- **Signerede webhooks:** HMAC-SHA256 i headeren `x-stemplet-signature`
  (hemmelighed = API-noeglen), saa modtageren kan verificere afsenderen.

## Overblik

| | Metode A: Kunde-QR | Metode B: Personale-scan | Metode C: API |
|---|---|---|---|
| Hvem scanner | Kunden scanner butikkens skaerm | Personalet scanner kundens kort | Systemet kalder selv |
| Hvem styrer | Kunden | Personalet | Kassesystemet |
| Cooldown | Ja (standard 120 min) | Nej | Nej |
| Flere stempler paa een gang | Nej | Ja | Ja |
| Kan indloese | Nej | Ja (med PIN) | Ja |
| Bedst til | Selvbetjening ved disken | Bemandet kasse, fuld kontrol | Automatisk drift |

## Bevidste beslutninger (aendres ikke)

- Cooldown forbliver 120 minutter som standard, justerbar pr. butik.
- Auto-stempel ved sideindlaesning (ingen bekraeft-knap) beholdes.
- Indloesning kraever altid personale-PIN. Kunden kan aldrig selv indloese.
- Personale-scan uden cooldown beholdes.
