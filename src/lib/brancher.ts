import type { Metadata } from "next";
import type { StampIconKey } from "./brand";

// Indhold til branchesiderne (SEO-landingssider pr. kundegruppe). EEN kilde, saa
// selve siderne, oversigten (/brancher) og sitemap alle bygger paa det samme.
// Teksten er redaktionel og skal bevares praecist som skrevet.

export type FaqItem = { q: string; a: string };
export type BrancheSection = {
  heading: string;
  paragraphs: string[];
  /** Valgfri punktliste (fx belOnnings-muligheder), vises efter afsnittene. */
  list?: string[];
  /** Valgfrit afsluttende afsnit, vises efter listen. */
  outro?: string[];
};
/** Et opsaetnings-eksempel til CTA'en: hvad udloeser hvad. */
export type BrancheExample = { target: string; reward: string };
/** Ikoner til hero-animationen. Delmaengde af StampIconKey (stamp-icon-paths),
 *  saa hero og kort viser praecis det samme ikon. */
export type BrancheIcon =
  | "coffee"
  | "scissors"
  | "heart"
  | "pizza"
  | "croissant"
  | "cupcake"
  | "icecream"
  | "wine"
  | "beer"
  | "cocktail"
  | "sparkle"
  | "flower"
  | "leaf"
  | "crown";

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
  /** Valgfrit konkret kort-design-eksempel (rigtigt StampCard) til siden. */
  cardExample?: {
    businessName: string;
    primaryColor: string;
    textColor: string;
    stampIcon: StampIconKey;
    required: number;
    stamps: number;
    rewardText: string;
  };
  /** Valgfrit stemnings-billede (tegning fra branchen), vist under hero'en. */
  sceneImage?: {
    src: string;
    alt: string;
    caption?: string;
  };
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
    "Kunden rejser sig fra stolen, smiler til spejlet og går hjem med et hår, der sidder præcis, som du havde tænkt. Du har brugt den rigtige voks, den rigtige shampoo og de rigtige produkter.",
    "Tre dage senere står kunden i Matas og køber noget helt andet.",
    "Klipningerne har loyale kunder. Produktsalget ryger ofte til supermarkedet. Stemplet kan være broen mellem de to.",
  ],
  sections: [
    {
      heading: "Gør dine produkter til en vane",
      paragraphs: [
        "Belønningen skal ikke bare være gratis. Den skal skabe en vane.",
        "Et oplagt setup er fem stempler, hvor det femte udløser et produkt, du selv har valgt til kunden. Kostprisen er lille, men værdien er stor. Når dit produkt står på kundens badeværelse, bliver det en del af deres rutine. Når det er tomt, ved kunden præcis, hvor det skal købes: hos dig.",
        "Giv samtidig et stempel, når kunden køber et produkt. Så belønner kortet både klipninger og produktsalg, og hver gang kunden handler hos dig, kommer den næste belønning tættere på.",
        "Belønningen bestemmer du selv. Det kan være en voks, en shampoo, en skægtrim eller en gratis vask. Kortet tilpasses din salon og kan ændres, når du vil.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet gør.",
        "Hver uge modtager du statistik over nye kortholdere, antal stempler og indløste belønninger. Du kan se, hvilke kunder der kommer igen, og opdage, når en fast kunde pludselig bliver væk. Det giver dig mulighed for at reagere, før stolen står tom.",
        "Kortet tæller også kundens samlede stempler. Det gør det nemt at belønne milepæle som 50 eller 100 besøg og skabe stamkunder, der bliver ambassadører for din salon.",
      ],
    },
    {
      heading: "Kom i gang på ti minutter",
      paragraphs: [
        "Kunden scanner en QR kode én gang og har kortet i Apple Wallet på under et minut. Ingen app. Ingen oprettelse.",
        "Du og dine medarbejdere stempler med den telefon, I allerede har. Intet ekstra udstyr. Intet nyt kassesystem. Kun flere grunde til, at kunderne kommer igen.",
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
  cardExample: {
    businessName: "Salon Nord",
    primaryColor: "#26403B",
    textColor: "#F3EEE4",
    stampIcon: "scissors",
    required: 5,
    stamps: 3,
    rewardText: "Et produkt fra hylden",
  },
};

export const KAFFEBARER: BrancheContent = {
  slug: "/stempelkort-til-kaffebarer",
  shortName: "Kaffebarer",
  cardTeaser: "Fra 10. kop til bønner på hylden.",
  stampIcon: "coffee",
  examples: [
    { target: "10. kop", reward: "Gratis" },
    { target: "Køb af bønner", reward: "+1 stempel" },
  ],
  title: "Stempelkort til kaffebarer. Fra 10. kop til bønner på hylden | Stemplet",
  metaDescription:
    "Klassikeren 10. kop gratis, uden pap. Og et kort, der også sælger dine bønner, så kunderne drikker din kaffe derhjemme.",
  eyebrow: "Stempelkort til kaffebarer",
  h1: "Gør kaffekunder til stamgæster.",
  intro: [
    "Kunden elsker kaffen og oplevelsen hos jer. Udfordringen er at give dem en grund til at vælge jer igen næste gang. Stemplet gør kaffekunder til stamgæster ved at holde relationen levende mellem besøgene.",
  ],
  sections: [
    {
      heading: "Byg en vane omkring din kaffebar",
      paragraphs: [
        "Den klassiske løsning virker: 10 stempler, 10. kop gratis. Kunden forstår det med det samme.",
        "Men kortet kan bruges til mere end en gratis kop. Det kan hjælpe dig med at skabe flere besøg, sælge mere og gøre dine bedste kunder endnu mere loyale.",
        "Når kunden samler stempler hos jer, bliver jeres kaffebar en del af deres rutine. Og når kunden forbinder kvalitet og kaffeoplevelsen med jer, vælger de jer igen næste gang.",
        "Belønningen kan være præcis det, der giver mening for din kaffebar:",
      ],
      list: [
        "En gratis kop kaffe",
        "En pose af jeres egne bønner",
        "Månedens specialkaffe",
        "En særlig oplevelse for faste kunder",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet giver dig data.",
        "Hver uge får du overblik over nye kortholdere, antal stempler og indløste belønninger. Over tid kan du se dine kunders rytme: Hvornår kommer de? Hvor ofte vender de tilbage? Hvornår begynder en stamkunde at falde væk?",
        "Det giver dig bedre beslutninger om alt fra bemanding i morgenrushet til kampagner, der faktisk rammer dine kunder.",
        "Kortet tæller også kundens samlede stempler. Når en kunde rammer 100 stempler, har du mulighed for at gøre noget ekstra: en kaffe på huset, en personlig hilsen eller en særlig overraskelse.",
        "De små handlinger er ofte dem, kunderne husker og fortæller videre.",
      ],
    },
    {
      heading: "Kom i gang før næste kaffepause",
      paragraphs: [
        "QR koden står ved kassen. Kunden scanner én gang og har kortet direkte i Apple Wallet på under et minut.",
        "Ingen app. Ingen oprettelse.",
        "Baristaen stempler fra den telefon, I allerede har.",
        "Ingen ekstra udstyr. Bare flere grunde til, at kunderne kommer igen.",
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
  cardExample: {
    businessName: "Kaffebar Syd",
    primaryColor: "#33241A",
    textColor: "#F3E9DC",
    stampIcon: "coffee",
    required: 10,
    stamps: 7,
    rewardText: "10. kop er gratis",
  },
  sceneImage: {
    src: "/brancher/kaffebar-scene.png",
    alt: "Kunde scanner Stemplet-koden på kaffebaren og har sit stempelkort med kaffe-stempler klar i Apple Wallet på telefonen.",
    caption: "Kunden scanner ved disken og har stempelkortet i Wallet med det samme.",
  },
};

export const NEGLESALONER: BrancheContent = {
  slug: "/stempelkort-til-neglesaloner",
  shortName: "Neglesaloner",
  cardTeaser: "Hold på dine faste kunder.",
  stampIcon: "sparkle",
  examples: [
    { target: "5. besøg", reward: "25 % rabat" },
    { target: "Produktkøb", reward: "+1 stempel" },
    { target: "50 besøg", reward: "Noget særligt" },
  ],
  title:
    "Stempelkort til neglesaloner. 25 % på hver 5. behandling | Stemplet",
  metaDescription:
    "Gør faste kunder til endnu mere loyale kunder. Beløn dem med rabatter via et digitalt stempelkort i Apple Wallet.",
  eyebrow: "Stempelkort til neglesaloner",
  h1: "Gør loyale kunder endnu mere loyale.",
  intro: [
    "De fleste kunder vender tilbage hver tredje eller fjerde uge. Når de har fundet en salon, de er glade for, bliver besøget hurtigt en fast del af hverdagen.",
    "Et stempelkort giver dem en ekstra grund til at blive ved med at vælge dig.",
  ],
  sections: [
    {
      heading: "Beløn de kunder, der kommer igen",
      paragraphs: [
        "En enkel model er 5 stempler, hvor det femte besøg udløser 25 % rabat på næste behandling.",
        "Belønningen ligger tæt nok på til at motivere, men langt nok ude til at skabe en vane. Kunden ved, at hvert besøg bringer dem tættere på den næste belønning, og det gør det mere naturligt at booke den næste tid hos dig.",
        "Belønningen er selvfølgelig helt op til dig. Nogle saloner vælger rabat, andre tilbyder gratis nail art, en paraffinbehandling eller et plejeprodukt til hjemmebrug.",
        "Du kan også give et stempel ved køb af negleolie, håndcreme eller andre produkter. Så belønner kortet både behandlinger og produktsalg, og kunderne vænner sig til at købe hjemmeplejen hos dig.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet gør.",
        "Hver uge får du et overblik over nye kortholdere, antal stempler og indløste belønninger. Du kan se, hvor ofte dine kunder kommer tilbage, og opdage, hvis en fast kunde pludselig springer en behandling over.",
        "Kortet tæller også kundens samlede stempler. Når en kunde når 50 eller 100 besøg, har du en oplagt mulighed for at gøre noget særligt. En lille ekstra gestus kan være forskellen på en loyal kunde og en kunde, der anbefaler din salon til sine veninder.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "Kunden scanner en QR kode én gang og har sit stempelkort direkte i Apple Wallet.",
        "Ingen app. Ingen oprettelse.",
        "Du stempler fra den telefon, du allerede har. Ingen ekstra udstyr. Ingen ændringer i dit bookingsystem. Bare en nem måde at skabe flere stamkunder på.",
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
  cardExample: {
    businessName: "Neglestudiet",
    primaryColor: "#6D4550",
    textColor: "#F4E8EC",
    stampIcon: "sparkle",
    required: 5,
    stamps: 3,
    rewardText: "25 % rabat",
  },
};

export const PIZZERIAER: BrancheContent = {
  slug: "/stempelkort-til-pizzeriaer",
  shortName: "Pizzeriaer",
  cardTeaser: "Fire pizzaer, fire stempler.",
  stampIcon: "pizza",
  examples: [
    { target: "10. pizza", reward: "Gratis" },
    { target: "4 pizzaer", reward: "4 stempler" },
    { target: "Tirsdag", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til pizzeriaer. Fire pizzaer, fire stempler | Stemplet",
  metaDescription:
    "Klassikeren 10. pizza gratis, uden papkort. Og familien med den store ordre får endelig alle sine stempler.",
  eyebrow: "Stempelkort til pizzeriaer",
  h1: "Gør pizzaaften til en tradition hos jer.",
  intro: [
    "Alle pizzeriaer har de kunder, man håber at se igen næste uge. Familien, der bestiller hver torsdag. Vennegruppen, der henter pizza hver fredag. De er rygraden i forretningen.",
    "Et digitalt stempelkort giver dem en ekstra grund til at vælge jer, hver gang lysten til pizza melder sig.",
  ],
  sections: [
    {
      heading: "Beløn de kunder, der kommer igen",
      paragraphs: [
        "Den klassiske model virker stadig: 10 stempler, 10. pizza gratis. Alle forstår den.",
        "Men i modsætning til det gamle papkort kan hele ordren tælle. Bestiller en familie fire pizzaer, får de fire stempler. Det føles fair og gør belønningen mere motiverende.",
        "Belønningen er helt op til jer. Det kan være en gratis pizza, en dessert, sodavand til børnene eller en særlig familiepakke. Kortet tilpasses jeres forretning og kan ændres, når I vil.",
      ],
    },
    {
      heading: "Skab flere stamkunder og fyld de stille dage",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet gør.",
        "Hver uge får I indsigt i nye kortholdere, antal stempler og indløste belønninger. I kan se, hvilke kunder der kommer igen, og hvilke dage der har brug for lidt ekstra trafik.",
        "Har tirsdagene brug for et løft? Giv dobbelt stempel den dag. Vil I belønne de mest loyale familier? Overrask dem med en ekstra gave, når de når 50 eller 100 stempler. De små gestus er ofte dem, kunderne husker og fortæller videre.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "Kunden scanner én QR kode og har stempelkortet direkte i Apple Wallet.",
        "Ingen app. Ingen oprettelse.",
        "I stempler med den telefon, I allerede har. Ingen ekstra udstyr. Bare flere grunde til, at kunderne vælger jer, næste gang de får lyst til pizza.",
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
  cardExample: {
    businessName: "Pizzeria Napoli",
    primaryColor: "#7E322A",
    textColor: "#F6EAE4",
    stampIcon: "pizza",
    required: 10,
    stamps: 7,
    rewardText: "10. pizza er gratis",
  },
};

export const BAGERIER: BrancheContent = {
  slug: "/stempelkort-til-bagerier",
  shortName: "Bagerier",
  cardTeaser: "Den daglige rutine tæller nu.",
  stampIcon: "croissant",
  examples: [
    { target: "10. kaffe", reward: "Gratis" },
    { target: "Kaffe eller kage", reward: "+1 stempel" },
    { target: "Stille formiddag", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til bagerier. Den daglige rutine tæller | Stemplet",
  metaDescription:
    "Morgenbrødskunden kommer igen og igen, året rundt. Giv den daglige rutine et digitalt stempelkort, der aldrig ryger i vasketøjet.",
  eyebrow: "Stempelkort til bagerier",
  h1: "Gør den daglige kaffetur til en fast tradition hos jer.",
  intro: [
    "Morgenbrødskunden er noget af det mest værdifulde, en bager kan have. Den samme kunde kommer igen og igen. Samme tidspunkt. Samme bestilling. Den samme lille pause i hverdagen.",
    "Men vaner er usynlige. Kunden siger sjældent farvel, hvis de begynder at købe morgenbrød et andet sted.",
    "Stemplet gør loyaliteten synlig og giver kunderne endnu en grund til at vælge jer.",
  ],
  sections: [
    {
      heading: "Beløn de små køb, der bliver til store vaner",
      paragraphs: [
        "De bedste stempler følger kundens naturlige rytme.",
        "Giv eksempelvis et stempel ved køb af kaffe, kage eller morgenbrød. Det er de køb, der sker igen og igen, og hvor en lille belønning kan gøre en stor forskel.",
        "10 stempler er enkelt at forstå. Den 10. kaffe kan være gratis, en kage til eftermiddagen eller en pose morgenbrød på husets regning.",
        "Belønningen behøver ikke være stor for jer, men den føles stor for kunden. Det er følelsen af at blive husket og værdsat, der bygger relationen.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et fysisk kort fortæller kun, at nogen har samlet stempler. Stemplet fortæller meget mere.",
        "Hver uge får I overblik over nye kortholdere, antal stempler og indløste belønninger. I kan se, hvornår kunderne kommer, hvilke køb der skaber loyalitet, og hvor der er mulighed for at skabe mere trafik.",
        "Har I en stille søndag? Lav dobbelt stempel i en periode. Vil I belønne jeres bedste kunder? Giv noget ekstra, når de når 50 eller 100 stempler.",
        "Kunden, der har samlet 100 stempler, er ikke bare en kunde. Det er en stamkunde, der har valgt jer igen og igen. En lille personlig hilsen eller en pose brød på husets regning kan skabe en historie, der bliver fortalt videre.",
      ],
    },
    {
      heading: "Kom i gang før morgenkøen",
      paragraphs: [
        "QR koden står ved kassen. Kunden scanner, mens kaffen bliver lavet, og har kortet direkte i Apple Wallet på under et minut.",
        "Ingen app. Ingen oprettelse.",
        "I stempler fra den telefon, I allerede har. Ingen ekstra udstyr.",
        "Bare en enkel måde at gøre flere kunder til faste kunder.",
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
  cardExample: {
    businessName: "Morgenbageren",
    primaryColor: "#7C5330",
    textColor: "#F5ECDC",
    stampIcon: "croissant",
    required: 10,
    stamps: 6,
    rewardText: "10. kaffe er gratis",
  },
};

export const BLOMSTERBUTIKKER: BrancheContent = {
  slug: "/stempelkort-til-blomsterbutikker",
  shortName: "Blomsterbutikker",
  cardTeaser: "Fredagsbuketten belønnet.",
  stampIcon: "flower",
  examples: [
    { target: "10. buket", reward: "Gratis" },
    { target: "5 stempler", reward: "Et smukt bånd" },
    { target: "Mors dag", reward: "Dobbelt stempel" },
  ],
  title:
    "Stempelkort til blomsterbutikker. Fredagsbuketten belønnet | Stemplet",
  metaDescription:
    "Dine faste kunder går forbi tre andre blomsterbutikker på vejen til din. Giv dem en grund til at blive ved. Digitalt stempelkort i Apple Wallet.",
  eyebrow: "Stempelkort til blomsterbutikker",
  h1: "Bliv kundens faste sted for de små øjeblikke.",
  intro: [
    "Blomster kan ligne et impulskøb. Men de bedste kunder er ofte vanekunder.",
    "Fredagsbuketten. Fødselsdagen. Søndagsbordet. Den månedlige buket til én, de holder af.",
    "De vælger ikke bare blomster. De vælger en butik, de stoler på. Stemplet hjælper med at gøre den relation endnu stærkere og giver kunderne en ekstra grund til at komme tilbage.",
  ],
  sections: [
    {
      heading: "Beløn de kunder, der vælger jer igen",
      paragraphs: [
        "Blomster handler om oplevelser, så belønningen behøver ikke kun være rabat.",
        "En enkel model er 10 stempler, hvor den 10. buket er på husets regning.",
        "En anden mulighed er at belønne oftere med små ekstra detaljer: et smukt bånd, en særlig blomst i buketten, lidt ekstra grønt eller en lille overraskelse.",
        "Det koster næsten ingenting, men kunden mærker forskellen. Det er følelsen af at blive genkendt, der skaber loyalitet.",
        "Belønningen bestemmer I selv. Kortet tilpasses jeres butik og kan ændres undervejs.",
      ],
    },
    {
      heading: "Få indsigt i jeres stamkunder",
      paragraphs: [
        "Et fysisk kort fortæller kun, at kunden har samlet stempler. Stemplet giver jer indsigt i relationen.",
        "Hver uge får I overblik over nye kortholdere, antal stempler og indløste belønninger. I kan se, hvor mange kunder der vender tilbage, og hvornår loyaliteten vokser.",
        "Op til mors dag, valentinsdag eller andre store anledninger kan I bruge ekstra stempler til at få kunderne til at vælge jer frem for supermarkedets hurtige løsning.",
        "Når en kunde rammer 100 stempler, er det mere end et tal. Det er mange års tillid og mange små øjeblikke, hvor de har valgt jer. En særlig buket eller en personlig hilsen kan gøre en god kunde til en ambassadør.",
      ],
    },
    {
      heading: "Kom i gang inden næste buket",
      paragraphs: [
        "QR koden står ved disken. Kunden scanner, mens buketten bliver bundet, og har kortet direkte i Apple Wallet på under et minut.",
        "Ingen app. Ingen oprettelse. I stempler fra den telefon, I allerede har.",
        "Bare en enkel måde at gøre flere kunder til faste kunder.",
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
  cardExample: {
    businessName: "Blomsterhjørnet",
    primaryColor: "#3E5546",
    textColor: "#EFF3EA",
    stampIcon: "flower",
    required: 10,
    stamps: 6,
    rewardText: "Den 10. buket er gratis",
  },
};

export const CAFEER: BrancheContent = {
  slug: "/stempelkort-til-caféer",
  shortName: "Caféer",
  cardTeaser: "Kaffe, vin og øl på samme kort.",
  stampIcon: ["coffee", "wine", "beer"],
  examples: [
    {
      target: "Køb over 50 kr.",
      reward: "Et stempel. Den 10. giver en kaffe eller øl",
    },
    {
      target: "Køb over 250 kr.",
      reward: "Et stempel. Den 10. giver en flaske vin",
    },
    { target: "Frokostmenuen", reward: "Et stempel. Den 10. er gratis" },
  ],
  title: "Stempelkort til caféer. Kaffe, vin og øl på samme kort | Stemplet",
  metaDescription:
    "Din café lever hele dagen: kaffen om morgenen, vinen om aftenen. Ét digitalt stempelkort, der tæller det hele.",
  eyebrow: "Stempelkort til caféer",
  h1: "Gør gæster til stamgæster.",
  intro: [
    "En god café bliver en del af kundens hverdag.",
    "Det er kaffen på vej til arbejde. Den hurtige frokost med en kollega. Eftermiddagen med en ven. Vinen eller øllen, når dagen skal afsluttes.",
    "De bedste caféer har ikke bare gæster. De har mennesker, der vælger dem igen og igen.",
    "Stemplet gør den vane synlig og giver kunderne en ekstra grund til at komme tilbage.",
  ],
  sections: [
    {
      heading: "Beløn hele caféoplevelsen",
      paragraphs: [
        "Loyalitet handler ikke kun om én bestemt vare. Det handler om hele oplevelsen hos jer.",
        "Giv eksempelvis ét stempel for en kaffe, et glas vin, en øl eller et køb over et bestemt beløb.",
        "Efter 10 stempler vælger I selv belønningen:",
      ],
      list: [
        "En gratis øl",
        "En gratis kaffe",
        "En kage til kaffen",
        "Et glas vin på huset",
        "En særlig oplevelse for faste gæster",
      ],
      outro: [
        "Det vigtigste er ikke selve belønningen. Det er følelsen af at blive genkendt og have en grund til at vælge jer igen.",
      ],
    },
    {
      heading: "Brug data til at skabe flere besøg",
      paragraphs: [
        "Et fysisk kort fortæller kun, at kunden har samlet stempler. Stemplet giver jer indsigt i jeres gæsters vaner.",
        "Hver uge får I overblik over nye kortholdere, antal stempler og indløste belønninger. I kan se, hvornår jeres gæster kommer, og hvor der er mulighed for at skabe mere aktivitet.",
        "Er eftermiddagen stille? Lav dobbelt stempel mellem 14 og 16. Vil I belønne jeres mest loyale gæster? Giv noget ekstra, når de rammer 50 eller 100 stempler.",
        "De bedste kunder skal ikke bare genkendes. De skal mærke, at de betyder noget.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "QR koden står ved kassen eller på bordet. Kunden scanner én gang og har kortet direkte i Apple Wallet.",
        "Ingen app. Ingen oprettelse. I stempler fra den telefon, I allerede har.",
        "En enkel måde at få flere gæster til at vælge jer igen og igen.",
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
  cardExample: {
    businessName: "Café Lys",
    primaryColor: "#3A2C24",
    textColor: "#F4E9DD",
    stampIcon: "coffee",
    required: 10,
    stamps: 7,
    rewardText: "Den 10. drik er på huset",
  },
};

export const ISBUTIKKER: BrancheContent = {
  slug: "/stempelkort-til-isbutikker",
  shortName: "Isbutikker",
  cardTeaser: "Hvert scoop tæller.",
  stampIcon: "icecream",
  examples: [
    { target: "Hver kugle", reward: "Et stempel. To kugler giver to" },
    { target: "5 stempler", reward: "Et gratis scoop eller topping" },
    { target: "Hele sæsonen", reward: "Ekstra ved 50 og 100 stempler" },
  ],
  title: "Stempelkort til isbutikker. Hvert scoop tæller | Stemplet",
  metaDescription:
    "Et stempel per scoop, det femte er gratis, og kortet overlever vinteren. Digitalt stempelkort i Apple Wallet til isbutikker.",
  eyebrow: "Stempelkort til isbutikker",
  h1: "Gør en is til en sommertradition.",
  intro: [
    "En god isbutik sælger ikke bare is. Den bliver en del af sommerens små øjeblikke.",
    "Turen efter aftensmaden. Søndagen ved stranden. Den spontane tur efter skole. De bedste kunder kommer ikke kun én gang, de skaber traditioner omkring jer.",
    "Stemplet hjælper jer med at gøre de små besøg til en vane.",
  ],
  sections: [
    {
      heading: "Gør loyalitet til en leg",
      paragraphs: [
        "Hos en isbutik behøver loyalitet ikke være kompliceret.",
        "Giv eksempelvis ét stempel pr. kugle. To kugler i vaflen giver to stempler, og efter fem scoops udløses en belønning.",
        "Det er så enkelt, at børnene selv kan følge med i køen.",
        "Belønningen vælger I selv:",
      ],
      list: [
        "Et gratis scoop",
        "Ekstra topping",
        "En større vaffel",
        "En særlig sommerbelønning",
      ],
      outro: [
        "Det handler ikke kun om rabatten. Det handler om glæden ved at være tættere på næste belønning.",
      ],
    },
    {
      heading: "Gør familier til faste gæster",
      paragraphs: [
        "Is bliver ofte købt sammen med andre. Derfor kan et stempelkort skabe flere vaner på én gang.",
        "Mor, far og børn kan hver have deres eget kort. Pludselig bliver én familie til flere loyale kunder, der hver har en grund til at komme tilbage.",
        "Når en kunde rammer 50 eller 100 stempler, ved I, at de ikke bare har købt en is. De har valgt jer igen og igen gennem hele sæsonen.",
        "En lille overraskelse eller en særlig hilsen kan gøre en fast kunde til én, der fortæller andre om jer.",
      ],
    },
    {
      heading: "Hold forbindelsen hele året",
      paragraphs: [
        "Det klassiske papkort forsvinder ofte sammen med sommeren.",
        "Et digitalt stempelkort ligger direkte i kundens Apple Wallet. Når solen kommer tilbage næste år, ligger jeres butik stadig hos kunden med alle stempler bevaret.",
        "Ingen app. Ingen oprettelse.",
        "Bare en enkel måde at gøre sommergæster til stamkunder.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "QR koden står ved disken. Kunden scanner én gang, og kortet er klar.",
        "I stempler fra den telefon, I allerede har.",
        "Ingen ekstra udstyr. Ingen ændringer i hverdagen.",
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
  cardExample: {
    businessName: "Isboden",
    primaryColor: "#245E63",
    textColor: "#EAF7F5",
    stampIcon: "icecream",
    required: 5,
    stamps: 3,
    rewardText: "Det 5. scoop er gratis",
  },
};

export const OELBARER: BrancheContent = {
  slug: "/stempelkort-til-ølbarer",
  shortName: "Ølbarer",
  cardTeaser: "10. fadøl på husets regning.",
  stampIcon: "beer",
  examples: [
    { target: "Hver øl", reward: "Et stempel. Den 10. fadøl er gratis" },
    { target: "Ny hane", reward: "Dobbelt stempel ved lancering" },
    { target: "100 stempler", reward: "Vælg næste gæstehane" },
  ],
  title: "Stempelkort til ølbarer. 10. fadøl på husets regning | Stemplet",
  metaDescription:
    "Klippekortet kender dine gæster allerede. Nu ligger det i Apple Wallet og bliver aldrig glemt hjemme. Ét stempel per øl, den tiende er gratis.",
  eyebrow: "Stempelkort til ølbarer",
  h1: "Gør stamgæster til en del af stedet.",
  intro: [
    "En god ølbar sælger ikke kun øl. Den skaber et sted, folk vender tilbage til.",
    "Det er de faste pladser ved baren. Vennerne, der mødes hver fredag. Gæsten, der altid prøver den nye hane. De mennesker, der vælger jer for stemningen lige så meget som for øllet.",
    "Stemplet gør den relation synlig og giver stamgæsterne noget at samle på.",
  ],
  sections: [
    {
      heading: "Gør hvert besøg til en del af historien",
      paragraphs: [
        "Klippekortet har altid passet godt til barer. Stemplet gør det bare digitalt.",
        "Giv eksempelvis ét stempel pr. øl, og lad den 10. fadøl være på husets regning.",
        "Kunden scanner én QR kode, kortet ligger direkte i Apple Wallet, og bartenderen stempler på få sekunder.",
        "Ingen papkort bag baren. Ingen kort, der bliver glemt derhjemme.",
        "Belønningen kan være meget mere end en gratis øl:",
      ],
      list: [
        "En øl på huset",
        "En særlig smagning",
        "Adgang til et eksklusivt event",
        "Første smagsprøve på en ny hane",
      ],
      outro: [
        "Det handler om at få gæsten til at føle sig som en del af stedet.",
      ],
    },
    {
      heading: "Byg et fællesskab omkring loyalitet",
      paragraphs: [
        "En ølbar kan noget, andre steder ikke kan. I kan gøre loyalitet til en del af oplevelsen.",
        "Giv dobbelt stempel ved lanceringen af en ny hane. Lad quizaftener eller særlige events tælle ekstra. Lav små overraskelser til de gæster, der kommer igen og igen.",
        "Når en gæst rammer 100 stempler, er det ikke bare et tal. Det er en person, der har valgt jer mange gange.",
        "Giv dem en særlig anerkendelse:",
      ],
      list: [
        "Et navn på en tavle",
        "En særlig invitation",
        "Muligheden for at vælge næste gæstehane",
      ],
      outro: ["Det er historier, gæster fortæller videre."],
    },
    {
      heading: "Brug data fra jeres egen bar",
      paragraphs: [
        "Et fysisk kort fortæller kun, at nogen har samlet stempler. Stemplet viser, hvordan jeres gæster faktisk bruger stedet.",
        "Hver uge får I overblik over nye kortholdere, stempler og indløste belønninger.",
        "Over tid kan I se:",
      ],
      list: [
        "Hvilke aftener jeres stamgæster kommer",
        "Hvilke events der skaber aktivitet",
        "Hvornår der er mulighed for at fylde mere i baren",
      ],
      outro: ["Mindre mavefornemmelse. Mere viden fra jeres egne gæster."],
    },
    {
      heading: "Kom i gang før fredagsbaren",
      paragraphs: [
        "QR koden står på baren og bordene. Kunden scanner, mens øllen bliver skænket.",
        "Ingen app. Ingen oprettelse.",
        "I stempler fra den telefon, I allerede har.",
        "En enkel måde at gøre gæster til stamgæster.",
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
  cardExample: {
    businessName: "Fadbaren",
    primaryColor: "#3B2A16",
    textColor: "#F5E6C8",
    stampIcon: "beer",
    required: 10,
    stamps: 8,
    rewardText: "Den 10. fadøl er gratis",
  },
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
