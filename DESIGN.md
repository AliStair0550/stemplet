# Folka Kort: design

Låst 1. november 2026. Det her er udseendet, vi bruger fremover. Nye sider og ændringer følger det. Afvigelser kræver Alis ja.

## Grundidé

- **Butikken i centrum.** Kunden ser butikkens navn, logo og farver. Folka står kun diskret i ejerens værktøj og i bunden af mails.
- **Natteblåt, roligt og luftigt.** Én skrift (Inter), få farver og bløde flader med god luft.
- **Telefonen først.** Alt designes til 390 px bredde og skaleres op. Ejeren bruger dashboardet på telefonen ved disken.
- **En handling ad gangen.** Hver skærm har én tydelig hovedknap. Resten er sekundære knapper eller links.

## Tre flader

| Flade | Hvor | Udtryk |
|---|---|---|
| Forside og salg | `/`, `/hør-mere`, branchesider | Natteblå hero med lys og svævende kort (`kundekort.css`, klasse `kk`), hvide sektioner, grå flader. |
| Ejerens værktøj | `/app`, `/start`, `/login`, `/kasse`, juridiske sider, `/find-kort` | Klassen `dash-theme`: kølig hvid grund, natteblå knapper, blå accenter. |
| Kundens kort | `/k/[slug]`, `/fordele`, Wallet-kortet | Butikkens egne farver og logo (inline styles). Ingen Folka-farver. |

## Farver

Brug disse værdier. Nye farver kræver et ja.

| Navn | Værdi | Bruges til |
|---|---|---|
| Nat | `#020B1C` | Mørkeste flade (footer, hero-bund) |
| Dyb | `#061C3D` | Hovedknapper, mørke paneler (Kom i gang) |
| Ocean | `#0A2D5A` | Hover på hovedknapper |
| Elektrisk | `#1B5EAE` | Accenter, links, aktive markeringer |
| Himmel | `#7CC4FF` | Accent på mørk flade (flueben, tællere) |
| Tone | `#E8F0FB` | Lyse markeringer, chips |
| Frost | `#F2F5F9` | Felter og grå flader |
| Side | `#F7F9FC` | Sidens baggrund i dashboardet |
| Blæk | `#0B1628` | Tekst |
| Dæmpet | `#5F6B7E` | Sekundær tekst |
| Etiket | `#6B7687` | Små etiketter (mindst 4,5:1 mod hvid) |
| Kant | `#E2E7ED` / `#CAD2DD` | Hårfine kanter / tydeligere kanter |
| Fejl | `#9E3B2E` (`text-rust`) | Kun fejlbeskeder |
| Guld | `#F2C14E` | Kun i fejringer (konfetti) |

I koden hedder de gamle Tailwind-navne stadig `ink`, `terracotta`, `parchment` osv. Under `.dash-theme` oversætter `globals.css` dem til farverne ovenfor. Skriv derfor `text-ink`, `bg-ink` og `text-terracotta` som i resten af koden. Brug aldrig terrakotta-farverne direkte: `#A6502E` og pergament er det gamle Stemplet-udtryk.

## Skrift

- **Inter** overalt (`--font-kk`). Instrument Sans og Fraunces er det gamle Stemplet-udtryk og bruges ikke på nye sider.
- **Sidetitel:** `text-[2rem] md:text-[2.4rem] font-bold tracking-[-0.035em]` (komponenten `PageHeading`).
- **Sektionsoverskrift:** `text-[1.15rem] font-semibold tracking-[-0.015em]`.
- **Brødtekst:** 0,9 til 1 rem. Sekundær tekst i `text-stone`.
- **Etiketter:** 0,78 til 0,8 rem, ingen versaler med spatiering i dashboardet.
- **Felter** er mindst 16 px på telefonen, så iPhone ikke zoomer.

## Form

- **Knapper:** helt runde (`rounded-full`), mindst 44 px høje. Brug `btnClass("primary" | "outline" | ...)` fra `components/ui`. Hovedknappen er natteblå, sekundære knapper har en hårfin kant, og tekstknapper er understreget.
- **Kort og paneler:** `Panel` (`rounded-[18px]`, hvid, `shadow-card`). Lister er kant-til-kant i et panel med `divide-y divide-fog` og rækker på `px-5 py-4`.
- **Felter:** grå flade (`#F2F5F9`) uden kant og blå kant ved fokus. Søgefelter og korte felter er runde (`rounded-full`).
- **Mørke paneler** (Kom i gang og fejring): `bg-[#061C3D]`, hvid tekst, `#7CC4FF` som accent, rækker i `bg-white/[.07]` med `ring-white/10`.
- **Avatar:** rund `bg-sand` med forbogstav (Kunder, Medarbejdere).
- **Skygger:** kun `shadow-card` på paneler og den store kortskygge (`kk-shadow-3`) på eksempelkort. Ingen `drop-shadow`-filtre på kort med QR-kode, fordi de gør dem uskarpe på iPhone.

## Komponenter, der skal genbruges

- **Sider:** `PageHeading`, `Panel`, `SectionHeader` (`components/dash`).
- **Knapper:** `btnClass`, `ButtonLink` (`components/ui`), `ShareCardButton` til deling.
- **Kortvisninger:**
  - `WalletCardPreview`: kortet som i Wallet, overalt i dashboardet og på salgssider om kunden.
  - `MemberCard`: eksempelkort på forsiden.
  - `StampCard`: kassen.
- **Top og bund på offentlige sider:** `LightHeader`, `Footer` og `Wordmark` (`components/kundekort/SiteChrome`).
- **Fejring:** `Confetti` (`components/Celebrate`), `GuideDone`, `FirstCustomerCelebration`.
- **Mails:** `folkaShell` i `lib/emails.ts`. Logoet er 38 px bredt, og bunden siger kun "kort.folka.dk".

## Bevægelse

- Korte og bløde animationer: `stampPop` (noget lykkes), `presencePulse` (noget venter), `kk-reveal` (sektioner glider ind), konfetti kun første gang.
- Alt står stille ved "reducér bevægelse" (`prefers-reduced-motion`).
- Ingen bevægelse, der flytter knapper, mens man trykker.

## Tekst

- Dansk med æ, ø og å. Korte sætninger i du-form. Ingen udråbstegn.
- **Ingen lange tankestreger** (em- og en-dash). Brug komma, punktum eller kolon.
- Produktet hedder **Folka Kort** (stort K). Aldrig "Stemplet" eller "Kundekort" som navn.
- Brug kundens ord: kort, stempel, rabat, tilbud. Undgå Wallet-, push- og it-ord i tekst til kunden.
- Fejl vises i `text-rust`.

## Tjek før en ny side går live

1. Ser den rigtig ud på 390 px uden vandret scroll, og er hovedknappen synlig uden at rulle?
2. Bruger den kun farverne og komponenterne ovenfor?
3. Er der én tydelig hovedhandling og en vej tilbage?
4. Står den stille ved "reducér bevægelse"?
5. Ingen lange tankestreger, og Folka Kort er stavet rigtigt?
