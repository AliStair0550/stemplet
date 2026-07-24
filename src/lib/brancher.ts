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
  cardTeaser: "Gør dine produkter til vane.",
  stampIcon: "scissors",
  examples: [
    { target: "Behandling", reward: "+1 stempel" },
    { target: "5 stempler", reward: "Et udvalgt produkt fra hylden" },
    { target: "10 stempler", reward: "Gratis vask og styling" },
  ],
  title:
    "Stempelkort til frisører. Gør dine produkter til vane | Stemplet",
  metaDescription:
    "Dine kunder elsker resultatet, men køber plejeprodukter i Matas. Et digitalt stempelkort kan få kunder til at købe produkter hos dig.",
  eyebrow: "Stempelkort til frisører",
  h1: "Kunden elsker resultatet. Men køber produkterne et andet sted.",
  intro: [
    "Kunden rejser sig fra stolen, smiler til spejlet og går hjem med et hår, der sidder præcis, som de havde ønsket sig. Du har brugt den rigtige shampoo, den rigtige mist eller voks.",
    "Tre dage senere står kunden i Matas og køber noget helt andet.",
  ],
  sections: [
    {
      heading: "Gør dine produkter til en vane",
      paragraphs: [
        "Belønningen skal ikke bare være gratis. Den skal skabe en vane.",
        "Et oplagt set-up er, at kunden samler et stempel efter hver behandling, hvor femte behandling udløser et gratis produkt. Kostprisen er lille, men værdien er stor. Når dit produkt står på kundens badeværelse, bliver det en del af deres daglige plejerutine. Når flasken er tom, ved kunden præcis, hvor det skal købes: Hos dig.",
        "Giv samtidig et stempel, når kunden køber et produkt. Så belønner kortet både klipninger og produktsalg, og hver gang kunden handler hos dig, kommer den næste belønning tættere på.",
        "Belønningen bestemmer du selvfølgelig selv. Det kan være et produkt: En voks, shampoo eller gratis hårolie. Det kan også være procentvis rabat på hver 5. behandling. Kortet tilpasses din salon og kan ændres, når du vil.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet giver dig data.",
        "Hver uge modtager du statistik på kortholdere, bl.a. antal stempler givet og indløste belønninger. Du kan se, hvor mange kunder der kommer igen som fast besøgende, og du får indblik i, hvis stamkunder pludselig bliver væk. Det giver dig mulighed for at reagere, før stolen står tom.",
        "Kortet tæller også kundens antal samlede stempler totalt set. Det gør det nemt at belønne milepæle som 50 eller 100 besøg og skabe stamkunder, der med tiden bliver ambassadører for din salon.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "Kunden scanner en QR kode én gang og har kortet i Apple Wallet på under et minut. Ingen app. Ingen oprettelse.",
        "Du eller dine medarbejdere stempler med den telefon eller tablet, I allerede har. Intet ekstra udstyr. Intet nyt kassesystem. Kun flere grunde til, at kunderne kommer igen.",
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
  sceneImage: {
    src: "/brancher/frisor-scene.png",
    alt: "Kunde i frisørsalonen scanner Stemplet-koden og har sit stempelkort i Apple Wallet på telefonen.",
    caption:
      "Kunden scanner i salonen og tilføjer kortet til Apple Wallet med ét tryk.",
  },
};

export const KAFFEBARER: BrancheContent = {
  slug: "/stempelkort-til-kaffebarer",
  shortName: "Kaffebarer",
  cardTeaser: "10. kop gratis, uden pap.",
  stampIcon: "coffee",
  examples: [
    { target: "10. kop", reward: "Gratis" },
    { target: "Køb af bønner", reward: "+1 stempel" },
  ],
  title:
    "Stempelkort til kaffebarer. 10. kop gratis, uden pap | Stemplet",
  metaDescription:
    "Giv kunderne en ekstra grund til at vælge din kaffebar, hver gang. Også når kaffetrangen melder sig ved de spontane besøg.",
  eyebrow: "Stempelkort til kaffebarer",
  h1: "Gør kaffekunder til stamgæster.",
  intro: [
    "Kunderne elsker kaffen og oplevelsen hos jer. Men konkurrencen er kun ét gadehjørne væk. Udfordringen er at give dem en grund til at tilvælge jeres kaffebar - gerne hver gang. Stemplet gør dine kaffeglade kunder til stamgæster ved at holde relationen levende mellem besøgene.",
  ],
  sections: [
    {
      heading: "Byg en vane omkring din kaffebar",
      paragraphs: [
        "Den klassiske løsning virker: 10 stempler, 10. kop gratis. Det er et koncept, som alle kunder kender og forstår. Et stempelkort kan dog bruges til mere end en gratis kop. Det skaber flere besøg, mersalg og gør dine bedste kunder endnu mere loyale. Digitaliseringen af stempelkortet sikrer, at kunden altid har kortet ved hånden. Også når de får lyst til et spontant besøg.",
        "Når kunden samler stempler hos jer, bliver besøg på jeres kaffebar en del af deres rutine. Og når kunden forbinder kvalitet og den gode kaffeoplevelse med jer, vælger de jer igen næste gang.",
        "Belønningen kan være præcis det, der giver mening for din kaffebar:",
      ],
      list: [
        "En gratis kop kaffe",
        "En pose af jeres egne kvalitetsbønner",
        "En helt særlig smagsoplevelse for faste kunder",
      ],
      outro: [
        "Kortet tæller også kundens antal samlede stempler totalt set. Det gør det nemt at belønne særlige milepæle som 50 eller 100 besøg. De små handlinger er ofte dem, kunderne husker og fortæller videre.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet giver dig data.",
        "Hver uge modtager du statistik på kortholdere, bl.a. antal stempler givet og indløste belønninger. Over tid kan du se værdifulde købsmønstre i dine kunders rytme: Hvornår kommer de? Hvor ofte vender de tilbage? Hvornår mister du loyale stamkunder? Det giver dig mulighed for at træffe bedre beslutninger om alt fra bemanding i baren under morgentravlheden, til at skabe kampagner der faktisk rammer dine kunder.",
      ],
    },
    {
      heading: "Kom i gang inden næste kaffepause",
      paragraphs: [
        "QR-koden printes og stilles ved kassen. Kunden scanner én gang og har kortet direkte i sin Apple Wallet på under et minut. Ingen app. Ingen oprettelse.",
        "Baristaen stempler kundens kort med den telefon eller tablet, I allerede har. Intet ekstra udstyr. Intet nyt kassesystem. Kun flere grunde til, at kunderne kommer igen.",
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
    caption:
      "Kunden scanner ved disken og tilføjer kortet til Apple Wallet med ét tryk.",
  },
};

export const NEGLESALONER: BrancheContent = {
  slug: "/stempelkort-til-neglesaloner",
  shortName: "Neglesaloner",
  cardTeaser: "Bliv kundernes førstevalg.",
  stampIcon: "sparkle",
  examples: [
    { target: "Behandling", reward: "+1 stempel" },
    { target: "5. besøg", reward: "25 % rabat" },
    { target: "50 besøg", reward: "Noget særligt" },
  ],
  title:
    "Stempelkort til neglesaloner. 25 % på hver 5. behandling | Stemplet",
  metaDescription:
    "Når det er tid til næste behandling, skal valget være nemt. Et digitalt stempelkort giver kunderne en ekstra grund til at vende tilbage til din salon.",
  eyebrow: "Stempelkort til neglesaloner",
  h1: "Gør loyale kunder endnu mere loyale.",
  intro: [
    "De fleste kunder får ordnet negle hver tredje eller fjerde uge. Når de først har fundet en salon, de er glade for, kan besøget hurtigt blive en fast del af rutinen.",
    "Et stempelkort giver dem en ekstra grund til at blive ved med at tilvælge din salon.",
  ],
  sections: [
    {
      heading: "Beløn de kunder, der kommer igen",
      paragraphs: [
        "En enkel model er 5 stempler, hvor der ved femte besøg udløses en procentvis rabat på valgte behandling.",
        "Belønningen ligger tæt nok på til at motivere, men langt nok ude til at skabe en vane. Kunden ved, at hvert besøg bringer dem tættere på den næste belønning, og det skaber et incitament til at booke den næste manicure hos dig.",
        "Du bestemmer selvfølgelig helt selv belønningen. Procentvis rabat på behandlinger, et gratis plejeprodukt til hjemmebrug, eller noget helt tredje der passer til ydelserne i din salon.",
      ],
    },
    {
      heading: "Få indsigt i dine stamkunder",
      paragraphs: [
        "Et papkort fortæller ingenting. Stemplet giver dig data.",
        "Hver uge modtager du statistik på kortholdere, bl.a. antal stempler givet og indløste belønninger. Du kan se, hvor ofte dine kunder besøger dig og opdage, når faste kunder springer behandlinger over. Det giver dig mulighed for at reagere, bl.a. ved at skabe kampagner der faktisk rammer dine stamkunder.",
        "Kortet tæller også kundens antal samlede stempler totalt set. Det gør det nemt at belønne særlige milepæle som 25 eller 50 besøg. En lille gestus kan gøre hele forskellen for en loyal kunde, der anbefaler salonen til andre bekendte.",
      ],
    },
    {
      heading: "Kom i gang på få minutter",
      paragraphs: [
        "QR-koden printes og stilles ved kassen. Kunden scanner én gang og har kortet direkte i sin Apple Wallet på under et minut. Ingen app. Ingen oprettelse.",
        "Du eller dine medarbejdere stempler med den telefon eller tablet, I allerede har. Intet ekstra udstyr. Intet nyt kassesystem. Kun flere grunde til, at kunderne kommer igen.",
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
  sceneImage: {
    src: "/brancher/neglesalon-scene.png",
    alt: "Kunde i neglesalonen scanner Stemplet-koden og har sit stempelkort i Apple Wallet på telefonen.",
    caption:
      "Kunden scanner ved kassen og tilføjer kortet til Apple Wallet med ét tryk.",
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
  sceneImage: {
    src: "/brancher/pizzeria-scene.png",
    alt: "Kunde i pizzeriaet scanner Stemplet-koden og har sit stempelkort i Apple Wallet på telefonen.",
    caption:
      "Kunden scanner ved bestillingen og tilføjer kortet til Apple Wallet med ét tryk.",
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
  sceneImage: {
    src: "/brancher/blomster-scene.png",
    alt: "Kunde i blomsterbutikken scanner Stemplet-koden og har sit stempelkort i Apple Wallet på telefonen.",
    caption:
      "Kunden scanner i butikken og tilføjer kortet til Apple Wallet med ét tryk.",
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
  sceneImage: {
    src: "/brancher/cafe-scene.png",
    alt: "Kunde på caféen scanner Stemplet-koden og har sit stempelkort i Apple Wallet på telefonen.",
    caption:
      "Gæsten scanner ved bordet og tilføjer kortet til Apple Wallet med ét tryk.",
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

export const BARER: BrancheContent = {
  slug: "/stempelkort-til-barer",
  shortName: "Barer",
  cardTeaser: "Den 10. genstand er gratis.",
  stampIcon: ["wine", "beer"],
  examples: [
    { target: "Hver genstand", reward: "Et stempel, øl som vin" },
    { target: "Den 10.", reward: "På husets regning" },
    { target: "Events", reward: "Dobbelt stempel" },
  ],
  title: "Stempelkort til barer. Den 10. genstand er gratis | Stemplet",
  metaDescription:
    "Klippekortet kender dine gæster allerede. Nu ligger det i Apple Wallet og bliver aldrig glemt hjemme. Et stempel pr. øl eller vin, den tiende er gratis.",
  eyebrow: "Stempelkort til barer",
  h1: "Gør stamgæster til en del af stedet.",
  intro: [
    "En god bar sælger ikke kun øl og vin. Den skaber et sted, folk vender tilbage til.",
    "Det er de faste pladser ved baren. Vennerne, der mødes hver fredag. Gæsten, der altid prøver noget nyt på listen. De mennesker, der vælger jer for stemningen lige så meget som for drinken.",
    "Stemplet gør den relation synlig og giver stamgæsterne noget at samle på.",
  ],
  sections: [
    {
      heading: "Gør hvert besøg til en del af historien",
      paragraphs: [
        "Klippekortet har altid passet godt til barer. Stemplet gør det bare digitalt.",
        "Giv eksempelvis ét stempel pr. genstand, øl som vin, og lad den 10. være på husets regning.",
        "Kunden scanner én QR kode, kortet ligger direkte i Apple Wallet, og bartenderen stempler på få sekunder.",
        "Ingen papkort bag baren. Ingen kort, der bliver glemt derhjemme.",
        "Belønningen kan være meget mere end en gratis genstand:",
      ],
      list: [
        "En øl eller et glas vin på huset",
        "En særlig smagning",
        "Adgang til et eksklusivt event",
        "Første smagsprøve på noget nyt på listen",
      ],
      outro: [
        "Det handler om at få gæsten til at føle sig som en del af stedet.",
      ],
    },
    {
      heading: "Byg et fællesskab omkring loyalitet",
      paragraphs: [
        "En bar kan noget, andre steder ikke kan. I kan gøre loyalitet til en del af oplevelsen.",
        "Giv dobbelt stempel til en ny vin på listen eller en ny hane. Lad quizaftener eller særlige events tælle ekstra. Lav små overraskelser til de gæster, der kommer igen og igen.",
        "Når en gæst rammer 100 stempler, er det ikke bare et tal. Det er en person, der har valgt jer mange gange.",
        "Giv dem en særlig anerkendelse:",
      ],
      list: [
        "Et navn på en tavle",
        "En særlig invitation",
        "Muligheden for at vælge næste vin eller gæstehane",
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
        "QR koden står på baren og bordene. Kunden scanner, mens der bliver skænket.",
        "Ingen app. Ingen oprettelse.",
        "I stempler fra den telefon, I allerede har.",
        "En enkel måde at gøre gæster til stamgæster.",
      ],
    },
  ],
  faq: [
    {
      q: "Tæller flere genstande i samme runde?",
      a: "Ja, bartenderen vælger antal. Tre genstande, tre stempler.",
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
    businessName: "Baren",
    primaryColor: "#3A2230",
    textColor: "#F3E7EC",
    stampIcon: "wine",
    required: 10,
    stamps: 8,
    rewardText: "Den 10. er gratis",
  },
  sceneImage: {
    src: "/brancher/bar-scene.png",
    alt: "Gæst ved baren scanner Stemplet-koden og har sit stempelkort med i Apple Wallet på telefonen.",
    caption:
      "Gæsten scanner ved baren og tilføjer kortet til Apple Wallet med ét tryk.",
  },
};

// Raekkefoelgen styrer visning paa /brancher og krydslinks.
// Raekkefoelgen fylder 3x3-gitteret paa /brancher raekkevis:
//   Bagerier      Caféer         Kaffebarer
//   Isbutikker    Pizzeriaer     Barer
//   Frisører      Neglesaloner   Blomsterbutikker
export const BRANCHER: BrancheContent[] = [
  BAGERIER,
  CAFEER,
  KAFFEBARER,
  ISBUTIKKER,
  PIZZERIAER,
  BARER,
  FRISOERER,
  NEGLESALONER,
  BLOMSTERBUTIKKER,
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
