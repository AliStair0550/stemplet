import type { Metadata } from "next";

// Indhold til branchesiderne (SEO-landingssider pr. kundegruppe). EEN kilde, saa
// selve siderne, oversigten (/brancher) og sitemap alle bygger paa det samme.
// Teksten er redaktionel og skal bevares praecist som skrevet.

export type FaqItem = { q: string; a: string };
export type BrancheSection = { heading: string; paragraphs: string[] };

export type BrancheContent = {
  /** Sti med dansk slug (aeoeaa), fx "/stempelkort-til-frisoerer". */
  slug: string;
  /** Kort navn til krydslinks og oversigtskort. */
  shortName: string;
  /** Vaerdiloefte i een linje til oversigtskortet. */
  cardTeaser: string;
  /** Ikon til hero-animationen (branchens eget stempel). */
  stampIcon: "coffee" | "scissors" | "heart";
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

// Raekkefoelgen styrer visning paa /brancher og krydslinks.
export const BRANCHER: BrancheContent[] = [FRISOERER, KAFFEBARER, NEGLESALONER];

/** De oevrige branchesider (til krydslinks nederst paa hver side). */
export function relatedBrancher(slug: string): BrancheContent[] {
  return BRANCHER.filter((b) => b.slug !== slug);
}

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
