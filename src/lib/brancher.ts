import type { Metadata } from "next";

// Indhold til branchesiderne (SEO-landingssider pr. kundegruppe). EEN kilde, saa
// selve siderne, oversigten (/brancher) og sitemap alle bygger paa det samme.
// Teksten er redaktionel og skal bevares praecist som skrevet.

export type FaqItem = { q: string; a: string };
export type BrancheSection = { heading: string; paragraphs: string[] };
/** Et opsaetnings-eksempel til CTA'en: hvad udloeser hvad. */
export type BrancheExample = { target: string; reward: string };
/** Ikoner til hero-animationen (laant fra stempel-gitteret). */
export type BrancheIcon =
  | "coffee"
  | "scissors"
  | "heart"
  | "pizza"
  | "croissant"
  | "icecream"
  | "wine"
  | "beer"
  | "flower";

export type BrancheContent = {
  /** Sti med dansk slug (aeoeaa), fx "/stempelkort-til-frisoerer". */
  slug: string;
  /** Kort navn til krydslinks og oversigtskort. */
  shortName: string;
  /** Vaerdiloefte i een linje til oversigtskortet. */
  cardTeaser: string;
  /** Ikon(er) til hero-animationen. Array = flere ikoner paa skift (fx café:
   *  kaffe/vin/oel, som fortaeller "hele dagen"). */
  stampIcon: BrancheIcon | BrancheIcon[];
  /** Levende opsaetnings-eksempler, maalrettet branchen (vises ved CTA'en). */
  examples: BrancheExample[];
  /** Praecis meta-title (inkl. "| Stemplet"). */
  title: string;
  /** Meta-description. */
  metaDescription: string;
  /** Lille label over H1 (baerer noegleordet). */
  eyebrow: string;
  /** H1: krogen. */
  h1: string;
  /** Intro-afsnit under H1. */
  intro: string[];
  /** Brodtekst-sektioner med overskrift. */
  sections: BrancheSection[];
  /** FAQ (bliver ogsaa til FAQPage structured data). */
  faq: FaqItem[];
};

export const FRISOERER: BrancheContent = {
  slug: "/stempelkort-til-frisører",
  shortName: "Frisører",
  cardTeaser: "Gør dine produkter til kundens vane.",
  stampIcon: "scissors",
  examples: [
    { target: "5 stempler", reward: "En voks fra hylden" },
    { target: "Produktkøb", reward: "+1 stempel" },
    { target: "Fyldt kort", reward: "Gratis vask og styling" },
  ],
  title:
    "Stempelkort til frisører. Gør dine produkter til kundens vane | Stemplet",
  metaDescription:
    "Dine kunder elsker resultatet fra stolen, men køber shampooen i Matas. Se hvordan et digitalt stempelkort vænner kunderne til dine produkter.",
  eyebrow: "Stempelkort til frisører",
  h1: "Kunden elsker resultatet. Men køber produkterne et andet sted.",
  intro: [
    "Du kender situationen. Kunden rejser sig fra stolen, kigger i spejlet og er glad. Håret sidder, som det skal, formet med den voks, du valgte til præcis den hårtype. Og tre dage senere står den samme kunde i Matas og køber noget helt andet, fordi det var det, der stod på hylden.",
    "Det er reelt to forretninger, du driver: klipningerne og produkterne. Den første har loyale kunder. Den anden lækker til supermarkedet. Stempelkortet er broen imellem.",
  ],
  sections: [
    {
      heading: "Sådan bygger du vanen",
      paragraphs: [
        "Tanken er enkel: brug belønningen til at få dine produkter ud i kundens badeværelse. Et oplagt setup er 5 stempler, hvor det femte udløser et produkt fra hylden. En voks, en shampoo, en olie, valgt af dig til den kundes hår. Kostprisen er lille. Effekten er stor, for nu står dit produkt derhjemme, og når det er tomt, ved kunden præcis, hvor det købes: hos dig, ved næste klipning.",
        "Giv også et stempel, når kunden køber et produkt. Så arbejder kortet begge veje: klipningerne fører til produkter, og produktkøb fører hurtigere til næste belønning. Efter et år har din faste kunde prøvet to eller tre af dine produkter, og badeværelseshylden derhjemme er blevet din.",
        "Og vigtigt: belønningen er helt dit valg. Nogle saloner foretrækker en gratis behandling som skægtrim eller vask og styling, andre en produktgave. Antal stempler og belønning sættes op, som det giver mening for din forretning, og kan justeres undervejs.",
      ],
    },
    {
      heading: "Tallene, du aldrig har haft",
      paragraphs: [
        "Hver mandag morgen lander en mail med ugens tal: nye kortholdere, stempler, indløste belønninger. For en frisør er det mest værdifulde tal dog rytmen. Du kan se, hvem der kommer fast, og du kan se, når rytmen knækker. Kunden, der kom hver sjette uge og nu har været væk i ti, er på vej til en anden saks, og en venlig besked når det, før stolen står tom. Én reddet stamkunde er 3.000 til 5.000 kr. om året. Det betaler kortet mange gange.",
        "Kortet tæller også kundens samlede stempler hos dig, og det åbner for milepæle: når en kunde runder fx 100 stempler i alt, ved du det, og en lille ekstra opmærksomhed, en gratis behandling eller en flaske af yndlingsproduktet, gør en fast kunde til en ambassadør. Det er den slags gestus, der bliver fortalt videre til vennerne.",
      ],
    },
    {
      heading: "Kom i gang på ti minutter",
      paragraphs: [
        "Kunden scanner en QR ved spejlet og har kortet i Apple Wallet på under et minut. Ingen app, ingen oprettelse. Du og dine ansatte stempler fra den telefon, I allerede har. Print-klart materiale følger med.",
      ],
    },
  ],
  faq: [
    {
      q: "Skal mine kunder hente en app?",
      a: "Nej. De scanner en QR, og kortet ligger i Apple Wallet med det samme.",
    },
    {
      q: "Bestemmer jeg selv belønningen?",
      a: "Ja, både antal stempler og belønning er dit valg og kan ændres.",
    },
    {
      q: "Kan flere ansatte stemple?",
      a: "Ja, stempelsiden er login-beskyttet og virker på alle telefoner.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr. om måneden ekskl. moms. Ingen binding.",
    },
  ],
};

export const KAFFEBARER: BrancheContent = {
  slug: "/stempelkort-til-kaffebarer",
  shortName: "Kaffebarer",
  cardTeaser: "Fra 10. kop til bønner på hylden.",
  stampIcon: "coffee",
  examples: [
    { target: "10. kop", reward: "Gratis" },
    { target: "Fyldt kort", reward: "En pose bønner" },
    { target: "Køb af bønner", reward: "+1 stempel" },
  ],
  title: "Stempelkort til kaffebarer. Fra 10. kop til bønner på hylden | Stemplet",
  metaDescription:
    "Klassikeren 10. kop gratis, uden pap. Og et kort, der også sælger dine bønner, så kunderne drikker din kaffe derhjemme.",
  eyebrow: "Stempelkort til kaffebarer",
  h1: "Din kaffe stopper ved døren. Det behøver den ikke.",
  intro: [
    "Din stamkunde drikker én kop hos dig om dagen. Og tre derhjemme, brygget på supermarkedsbønner. Det er det stille tab i enhver kaffebar: kunderne elsker din kaffe, men kun den, du selv skænker. Bønnerne på hylden bag disken, dem du har valgt med omhu, går de fleste forbi hver eneste morgen.",
    "Stempelkortet løser først det klassiske problem, papkortet der bliver væk. Men brugt rigtigt løser det også det store: det får dine bønner med hjem.",
  ],
  sections: [
    {
      heading: "Sådan sætter du kortet op",
      paragraphs: [
        'Klassikeren virker: 10 stempler, 10. kop gratis, forstået på et sekund. Men overvej at lade kortet arbejde for hylden. Giv et stempel, når en kunde køber en pose bønner, eller gør en pose til belønningen i stedet for en kop: "10 stempler giver en pose af månedens bønner". Kunden, der har smagt sine egne morgenkopper på dine bønner, kommer tilbage efter den næste pose. Nu sælger du ikke bare kaffe over disken, du er kundens kaffeleverandør.',
        "Belønningen er dit valg, og der er ingen facitliste. Nogle barer kører den rene klassiker, andre blander: kop til hverdagskunderne, bønner til entusiasterne. Antal stempler, hvad der udløser dem, og hvad der venter for enden, sættes op efter din bar og kan justeres når som helst.",
      ],
    },
    {
      heading: "Tallene bag rutinen",
      paragraphs: [
        "Mandagsrapporten viser ugens nye kortholdere, stempler og indløsninger, og over tid tegner den din forretnings rytme: hvilke dage dine stamkunder faktisk kommer, og hvornår de bliver væk. Det er planlægningsguld, fra bemanding i morgenrushet til hvilken dag en kampagne gør størst gavn.",
        "Og fordi kortet tæller kundens samlede stempler, kan du fejre de store tal. Kunden, der runder 100 stempler, er ikke en kunde længere, det er en stamgæst med aktier i stedet. Markér det: en pose bønner med en håndskrevet hilsen, koppen på husets regning, et billede til jeres Instagram hvis kunden er med på den. Loyalitet, der bliver set, bliver fortalt videre.",
      ],
    },
    {
      heading: "I gang før frokostrushet",
      paragraphs: [
        "QR'en står ved kassen, kunden scanner, mens mælken skummes, og kortet ligger i Apple Wallet på under et minut. Ingen app. Baristaen stempler på to sekunder fra sin egen telefon. Print-klart materiale følger med.",
      ],
    },
  ],
  faq: [
    {
      q: "Sinker det køen?",
      a: "Nej. Scanningen er hurtigere end at finde og klippe et papkort.",
    },
    {
      q: "Kan stemplet gælde andet end kaffe?",
      a: "Ja, du bestemmer selv reglen, fx alt over et minimumsbeløb, bønneposer inklusive.",
    },
    {
      q: "Bestemmer jeg selv belønningen?",
      a: "Ja, helt. Kop, bønner eller noget tredje, og det kan ændres undervejs.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr. om måneden ekskl. moms. Ingen binding.",
    },
  ],
};

export const NEGLESALONER: BrancheContent = {
  slug: "/stempelkort-til-neglesaloner",
  shortName: "Neglesaloner",
  cardTeaser: "Hold på dine faste kunder.",
  stampIcon: "heart",
  examples: [
    { target: "Hver 5. behandling", reward: "25% rabat" },
    { target: "Fyldt kort", reward: "Nail art oveni" },
    { target: "Produktkøb", reward: "+1 stempel" },
  ],
  title:
    "Stempelkort til neglesaloner. Hver 5. behandling til kvart pris | Stemplet",
  metaDescription:
    "Dine kunder kører i faste cyklusser. Giv cyklussen et regnskab med et digitalt stempelkort i Apple Wallet, fx 25 procent på hver 5. behandling.",
  eyebrow: "Stempelkort til neglesaloner",
  h1: "Skiftet sker i stilhed. Kortet holder på dem.",
  intro: [
    "Neglekunder er vanekunder. Tre til fire uger mellem behandlinger, samme salon, samme behandler. Men skiftet til salonen på den anden side af gaden sker uden varsel. Ingen klager, ingen besked. De udebliver bare, og du opdager det først, når kalenderen har huller.",
    "Stempelkortet lægger et lille regnskab ind i cyklussen. Hvert besøg tæller mod noget konkret, og det gør det en anelse sværere at prøve et nyt sted, for regnskabet står hos dig.",
  ],
  sections: [
    {
      heading: "Sådan sætter du kortet op",
      paragraphs: [
        "En model, der rammer rytmen: 5 stempler, og det femte udløser 25 procent rabat på behandlingen. For en fast kunde ligger belønningen tre til fire måneder ude, tæt nok til at trække, og rabatten mærkes som en rigtig gestus på en behandling til fuld værdi.",
        "Og som altid: belønningen er dit valg. Nogle saloner foretrækker en opgradering i stedet, en nail art-detalje eller en paraffinbehandling oveni, andre en produktgave til hjemmeplejen. Antal stempler og belønning sættes op efter din salon og kan ændres, når du bliver klogere på, hvad kunderne reagerer på.",
        "Et ekstra greb: stempl også ved produktkøb, olier og cremer til hjemmeplejen. Så tæller hele forretningen med, og kunderne vænner sig til, at hjemmepleje-produkterne også købes hos dig.",
      ],
    },
    {
      heading: "Tallene mellem behandlingerne",
      paragraphs: [
        'Mandagsrapporten giver ugens nye kortholdere, stempler og indløsninger. Men det vigtigste tal for en salon er intervallet. Du kan se, når fire uger bliver til otte, og det er præcis der, en venlig sms stadig kan nå det: "Vi har en tid på torsdag, hvis det passer". Ingen kampagne slår den besked på det tidspunkt.',
        "Livstidstallet, kundens samlede stempler hos dig, gør de bedste kunder synlige. Runder en kunde 100 stempler, er det årevis af trofasthed, og et lille ritual omkring det, en gratis opgradering og et stort tillykke, skaber den slags historie, veninderne får fortalt. Dine mest loyale kunder er din bedste markedsføring, hvis de bliver set.",
      ],
    },
    {
      heading: "I gang mellem to kunder",
      paragraphs: [
        "QR'en står ved bordet, kunden scanner, mens neglene tørrer, og kortet ligger i Apple Wallet på under et minut. Ingen app, intet bookingsystem der skal skiftes. Du stempler fra din egen telefon. Print-klart materiale følger med.",
      ],
    },
  ],
  faq: [
    {
      q: "Vi bruger online booking. Skal det integreres?",
      a: "Nej, kortet kører ved siden af. Scan ved besøget, færdig.",
    },
    {
      q: "Bestemmer jeg selv rabat eller gave?",
      a: "Ja, belønningen er helt dit valg og kan ændres undervejs.",
    },
    {
      q: "Kan to behandlere stemple fra hver sin telefon?",
      a: "Ja, stempelsiden virker på alle telefoner med login.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr. om måneden ekskl. moms. Ingen binding.",
    },
  ],
};

export const PIZZERIAER: BrancheContent = {
  slug: "/stempelkort-til-pizzeriaer",
  shortName: "Pizzeriaer",
  cardTeaser: "Fire pizzaer, fire stempler.",
  stampIcon: "pizza",
  examples: [
    { target: "10. pizza", reward: "Gratis" },
    { target: "4 pizzaer", reward: "4 stempler" },
    { target: "Fyldt kort", reward: "Gratis dessert" },
  ],
  title: "Stempelkort til pizzeriaer. Fire pizzaer, fire stempler | Stemplet",
  metaDescription:
    "Klassikeren 10. pizza gratis, uden papkort. Og familien med den store ordre får endelig alle sine stempler.",
  eyebrow: "Stempelkort til pizzeriaer",
  h1: "Torsdagsfamilien er din bedste kunde. Behandl den sådan.",
  intro: [
    "Familien, der henter fire pizzaer hver torsdag, er guld. Men papkortet gav dem altid kun ét klip, uanset ordren. Det er sluttet nu.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "Behold klassikeren: 10 stempler, 10. pizza gratis. Alle forstår den. Forskellen er antallet: fire pizzaer giver fire stempler i én scanning. Familien når belønningen på få uger, og det kan mærkes, at du tæller ærligt. Belønningen bestemmer du selv, gratis pizza er standarden, men en gratis dessert eller sodavand til børnene virker også.",
      ],
    },
    {
      heading: "Tallene",
      paragraphs: [
        "Mandagsrapporten viser dine faste kunder og dine stille dage. Dobbelt stempel om tirsdagen flytter fredagsordrer til den dag, ovnen står halvtom. Og runder en familie 100 stempler i alt, så skriv deres navn på bakken og giv en gratis. Den historie fortæller de i skolegården.",
      ],
    },
    {
      heading: "I gang i aften",
      paragraphs: [
        "QR på disken og på pizzabakken. Kunden scanner, mens ovnen arbejder. Ingen app.",
      ],
    },
  ],
  faq: [
    {
      q: "Giver én stor ordre flere stempler?",
      a: "Ja, personalet vælger antal. Fire pizzaer, fire stempler.",
    },
    {
      q: "Bestemmer jeg selv belønningen?",
      a: "Ja, helt, og den kan ændres undervejs.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

export const BAGERIER: BrancheContent = {
  slug: "/stempelkort-til-bagerier",
  shortName: "Bagerier",
  cardTeaser: "Lørdagsposen tæller nu.",
  stampIcon: "croissant",
  examples: [
    { target: "10. kaffe", reward: "Gratis" },
    { target: "Kaffe eller kage", reward: "+1 stempel" },
    { target: "Fyldt kort", reward: "En pose morgenbrød" },
  ],
  title: "Stempelkort til bagerier. Lørdagsposen tæller nu | Stemplet",
  metaDescription:
    "Morgenbrødskunden kommer hver weekend, året rundt. Giv rutinen et digitalt stempelkort, der aldrig ryger i vasketøjet.",
  eyebrow: "Stempelkort til bagerier",
  h1: "Danmarks stærkeste vane går forbi din disk hver lørdag",
  intro: [
    "Morgenbrødskunden er den mest trofaste menneske. Samme tid, samme pose, år efter år. Men vanen er tavs, og den dag den flytter til supermarkedets bake-off, siger ingen noget. Stempelkortet gør vanen synlig og giver den en grund til at blive.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "Giv et stempel, når kunden køber kaffe eller kage. Det er de køb, hvor vanen bor: kaffen på vej til arbejde, kagen til eftermiddagen, og det er samtidig varerne med den bedste avance. 10 stempler passer rytmen, og belønningen vælger du selv: 10. kaffe gratis, en kage til kaffen eller en pose morgenbrød på husets regning. Duften af gratis bagværk er den bedste reklame, der findes.",
      ],
    },
    {
      heading: "Tallene",
      paragraphs: [
        "Rapporten hver mandag viser ugens kortholdere og stempler, og hvilke dage der bærer. Mange bagerier opdager, at loyaliteten bor om lørdagen, og at søndagen kan løftes med dobbelt stempel i en måned. Kunden, der runder 100 stempler i alt, har drukket morgenkaffe hos dig i årevis. En pose på husets regning og et tillykke gør trofasthed til en historie.",
      ],
    },
    {
      heading: "I gang før weekenden",
      paragraphs: [
        'QR ved kassen, "scan mens du venter". Morgenkøen er din tilmeldingsmaskine.',
      ],
    },
  ],
  faq: [
    {
      q: "Hvad med kontantkunder?",
      a: "Kortet er uafhængigt af betalingsform.",
    },
    {
      q: "Bestemmer jeg selv, hvad der udløser et stempel?",
      a: "Ja, kaffe, kage eller begge, og belønningen er også dit valg.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

export const BLOMSTERBUTIKKER: BrancheContent = {
  slug: "/stempelkort-til-blomsterbutikker",
  shortName: "Blomsterbutikker",
  cardTeaser: "Fredagsbuketten belønnet.",
  stampIcon: "flower",
  examples: [
    { target: "10 stempler", reward: "Et gratis bundt" },
    { target: "5 stempler", reward: "En lille gave oveni" },
    { target: "Højtider", reward: "Dobbelt stempel" },
  ],
  title:
    "Stempelkort til blomsterbutikker. Fredagsbuketten belønnet | Stemplet",
  metaDescription:
    "Dine faste kunder går forbi tre andre blomsterbutikker på vejen til din. Giv dem en grund til at blive ved. Digitalt stempelkort i Apple Wallet.",
  eyebrow: "Stempelkort til blomsterbutikker",
  h1: "Fredagsbuketten er en kærlighedserklæring. Også til din butik.",
  intro: [
    "Blomster ligner impulskøb, men dine bedste kunder er vanekunder: fredagsbuketten, søndagsbordet, den månedlige til svigermor. De går forbi tre andre butikker på vejen til din. Stempelkortet siger tak for det, hver gang.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "To modeller, der begge virker, og valget er dit. Den generøse: 10 stempler, og det tiende er et gratis bundt. Den hurtige: 5 stempler, og det femte udløser en lille ekstra gave, en håndfuld eukalyptus oveni, et flot bånd, en enkelt særlig blomst i buketten. Den hurtige model belønner oftere og koster dig næsten ingenting, den generøse er nemmest at forklare i køen. Begge kan justeres undervejs.",
      ],
    },
    {
      heading: "Tallene",
      paragraphs: [
        "Mandagsrapporten viser dine faste ansigter og dine stille uger. Op til mors dag og valentinsdag kan dobbelt stempel flytte kunder fra supermarkedsbuketten til dig. Og kunden, der runder 100 stempler, har fejret års mærkedage gennem din butik. Det fortjener en buket på husets regning og et billede til jeres Instagram, hvis kunden vil.",
      ],
    },
    {
      heading: "I gang inden fredag",
      paragraphs: [
        "QR ved disken, kunden scanner mens buketten bindes. Det er de bedste 40 sekunder at sælge loyalitet i.",
      ],
    },
  ],
  faq: [
    {
      q: "Virker det for højtidskunder, der kommer sjældent?",
      a: "Ja, stemplerne udløber aldrig. Netop de kunder skal have en grund til at komme mellem højtiderne.",
    },
    {
      q: "Bestemmer jeg selv belønningen?",
      a: "Ja, gratis bundt, lille gave eller noget tredje, og antal stempler kan ændres.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

export const CAFEER: BrancheContent = {
  slug: "/stempelkort-til-caféer",
  shortName: "Caféer",
  cardTeaser: "Kaffe, vin og øl på samme kort.",
  stampIcon: ["coffee", "wine", "beer"],
  examples: [
    { target: "Kaffe, vin eller øl", reward: "+1 stempel" },
    { target: "10 stempler", reward: "En gratis drik" },
    { target: "Stille timer", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til caféer. Kaffe, vin og øl på samme kort | Stemplet",
  metaDescription:
    "Din café lever hele dagen: kaffen om morgenen, vinen om aftenen. Ét digitalt stempelkort, der tæller det hele.",
  eyebrow: "Stempelkort til caféer",
  h1: "Morgenkaffen og aftenvinen er samme kunde",
  intro: [
    "Din café har ikke én stamgæst, den har tre i samme person: hende med den store latte klokken otte, frokostkunden klokken tolv, og parret med glasset vin klokken sytten. Papkortet talte kun kaffen. Dit kort skal tælle hele dagen.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "Ét stempel per drikkevare, kaffe, glas vin eller fadøl. 10 stempler, og belønningen vælger du selv: en gratis kop, et glas af husets vin eller en øl fra hanen. Pludselig arbejder loyaliteten hele åbningstiden, og morgenkunden får en grund til også at komme om aftenen. Det er dét skifte, der fylder de stille timer.",
      ],
    },
    {
      heading: "Tallene",
      paragraphs: [
        "Mandagsrapporten viser, hvornår dine stamgæster faktisk kommer, og hvor hullerne er. Er eftermiddagen stille, kan dobbelt stempel mellem 14 og 16 flytte besøg derhen. Og gæsten, der runder 100 stempler, har levet en del af sit liv hos jer. Det fortjener en plads med navn på baren for en dag, eller bare første række, når der sker noget. Set loyalitet er delt loyalitet.",
      ],
    },
    {
      heading: "I gang i dag",
      paragraphs: [
        "QR ved kassen og på bordene. Gæsten scanner, mens kaffen laves eller vinen skænkes. Ingen app.",
      ],
    },
  ],
  faq: [
    {
      q: "Tæller alle drikkevarer?",
      a: "Du bestemmer selv reglen: kun kaffe, alle drikke eller alt over et beløb.",
    },
    {
      q: "Bestemmer jeg selv belønningen?",
      a: "Ja, helt, og den kan ændres undervejs.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

export const ISBUTIKKER: BrancheContent = {
  slug: "/stempelkort-til-isbutikker",
  shortName: "Isbutikker",
  cardTeaser: "Hvert scoop tæller.",
  stampIcon: "icecream",
  examples: [
    { target: "5 scoops", reward: "Femte gratis" },
    { target: "Hvert scoop", reward: "+1 stempel" },
    { target: "Regnvejr", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til isbutikker. Hvert scoop tæller | Stemplet",
  metaDescription:
    "Et stempel per scoop, det femte er gratis, og kortet overlever vinteren. Digitalt stempelkort i Apple Wallet til isbutikker.",
  eyebrow: "Stempelkort til isbutikker",
  h1: "Fire scoops. Så er det femte på husets regning.",
  intro: [
    "Is skal være sjovt, og det skal jeres stempelkort også. Glem besøg og beløb: hos jer tæller hvert scoop. To kugler i vaflen er to stempler, og det femte scoop er gratis. Regnestykket er så enkelt, at børnene regner det ud i køen, og det er præcis meningen.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "Ét stempel per scoop, femte scoop gratis, og kortet gælder per person. Far, mor og to børn har hver deres kort, og familien går hjem med fire regnskaber i gang. Det giver fire grunde til at vælge jer næste gang solen skinner. Belønningen er som altid jeres eget valg, gratis scoop er klassikeren, en topping eller vaffelopgradering virker også.",
      ],
    },
    {
      heading: "Tallene",
      paragraphs: [
        "Rapporten viser jeres rytme, og den er guld i en vejrbranche: hvilke dage bærer, og hvor dybt regnvejrsdagene rammer. Dobbelt stempel når det gråner flytter familier ud ad døren alligevel. Og kunden, der runder 100 scoops på en sæson, er ikke en kunde, det er en legende. Tag billedet, giv en gratis vaffel, og lad væggen bag disken fortælle historien.",
      ],
    },
    {
      heading: "Vinterens hemmelighed",
      paragraphs: [
        "Papkortet fra august ryger ud i november. Jeres kort ligger stadig i kundens Wallet til foråret, med alle stempler intakte. Sidste års børn åbner sæsonen som stamkunder.",
      ],
    },
  ],
  faq: [
    {
      q: "Gælder kortet per person eller per familie?",
      a: "Per person. Det er det, der gør det sjovt, og fire kort fyldes hurtigere end ét.",
    },
    {
      q: "Hvad med lukket vintersæson?",
      a: "Stemplerne udløber aldrig. Kortet venter på jer.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

export const OELBARER: BrancheContent = {
  slug: "/stempelkort-til-ølbarer",
  shortName: "Ølbarer",
  cardTeaser: "10. fadøl på husets regning.",
  stampIcon: "beer",
  examples: [
    { target: "10 øl", reward: "Tiende gratis" },
    { target: "3 fadøl", reward: "3 stempler" },
    { target: "Nye haner", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til ølbarer. 10. fadøl på husets regning | Stemplet",
  metaDescription:
    "Klippekortet kender dine gæster allerede. Nu ligger det i Apple Wallet og bliver aldrig glemt hjemme. Ét stempel per øl, den tiende er gratis.",
  eyebrow: "Stempelkort til ølbarer",
  h1: "Dine stamgæster samler allerede. På historier, haner og hinanden.",
  intro: [
    "En god ølbar har noget, ingen anden butik har: gæster, der kommer for stedet lige så meget som for øllet. De faste ansigter ved baren, vennerne ved det samme bord, nørderne der smager alt nyt på hanerne. Giv dem noget at samle på.",
  ],
  sections: [
    {
      heading: "Sådan gør du",
      paragraphs: [
        "Klippekortet er en gammel ven i danske barer, nu digitalt: ét stempel per øl, tiende fadøl på husets regning. Gæsten scanner jeres QR, kortet ligger i Apple Wallet, og bartenderen stempler på to sekunder, tre fadøl til bordet er tre stempler i én scanning. Intet pap bag baren, intet kort glemt hjemme.",
      ],
    },
    {
      heading: "Gør kortet til en del af stedet",
      paragraphs: [
        "Her kan jeres bar noget, en kaffebar ikke kan. Lad nye haner give dobbelt stempel i udgivelsesugen, så bliver premieren et tilløbsstykke, og lad quizaftenen tælle ekstra. Gæsten, der runder 100 stempler, har fortjent mere end en øl: navnet på messingskiltet, æren af at vælge næste gæstehane, sit eget krus på hylden. Den slags bliver der pralet med, og pral er gratis markedsføring.",
      ],
    },
    {
      heading: "Tallene bag aftenen",
      paragraphs: [
        "Hver mandag en rapport med kortholdere, stempler og indløsninger. Over tid ser I, hvilke aftener jeres faste gæster faktisk kommer, og hvilke der kan løftes. Bedre bemanding, bedre events og bedre indkøb, fra jeres egen bar frem for mavefornemmelsen.",
      ],
    },
    {
      heading: "I gang før fredag",
      paragraphs: [
        "QR på baren og bordkortene. Gæsten scanner, mens der skænkes. Ingen app, ingen oprettelse.",
      ],
    },
  ],
  faq: [
    {
      q: "Tæller flere øl i samme runde?",
      a: "Ja, bartenderen vælger antal. Tre fadøl, tre stempler.",
    },
    {
      q: "Bestemmer jeg selv antal stempler og belønning?",
      a: "Ja, begge dele, og de kan ændres undervejs.",
    },
    {
      q: "Kan flere bartendere stemple?",
      a: "Ja, stempelsiden er login-beskyttet og virker på alle telefoner.",
    },
    {
      q: "Hvad koster det?",
      a: "Ingenting op til 100 kortholdere. Derefter 99 kr./md. ekskl. moms.",
    },
  ],
};

// Raekkefoelgen styrer visning paa /brancher og krydslinks.
export const BRANCHER: BrancheContent[] = [
  FRISOERER,
  KAFFEBARER,
  NEGLESALONER,
  PIZZERIAER,
  BAGERIER,
  BLOMSTERBUTIKKER,
  CAFEER,
  ISBUTIKKER,
  OELBARER,
];

/** Metadata til en branchesides `export const metadata`. */
export function brancheMetadata(b: BrancheContent): Metadata {
  return {
    // absolute: brug den praecise title (inkl. "| Stemplet") uden layout-templaten.
    title: { absolute: b.title },
    description: b.metaDescription,
    alternates: { canonical: b.slug },
    openGraph: {
      title: b.title,
      description: b.metaDescription,
      url: b.slug,
      type: "website",
    },
  };
}
