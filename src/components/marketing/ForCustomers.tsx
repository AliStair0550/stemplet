import { Section, Eyebrow } from "@/components/ui";
import { RelationshipGraphic } from "@/components/marketing/RelationshipGraphic";

const CUSTOMER = [
  "Ingen app, ingen konto, intet at installere.",
  "Bliver aldrig væk, det ligger altid i Wallet.",
  "Klar ved kassen på et øjeblik. Intet papkort at lede efter.",
  "De ser præcis, hvor tæt de er på næste gratis.",
  "Helt anonymt, hvis de vil. Data ligger i EU.",
];

const BUSINESS = [
  "Du ligger i kundens Wallet og bliver set, hver gang de åbner telefonen.",
  "Flere genbesøg og faste kunder, uge efter uge.",
  "Du ser genbesøg, stempler og indløsninger, sort på hvidt.",
  "Ingen kan snyde. Hvert stempel er signeret.",
];

function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[2px] h-4 w-4 shrink-0 text-moss"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Benefits({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="text-[0.65rem] font-[400] uppercase tracking-[0.14em] text-moss">
        {label}
      </span>
      <ul className="mt-5 flex flex-col gap-3.5">
        {items.map((p) => (
          <li key={p} className="flex gap-3">
            <CheckMark />
            <span className="font-[300] text-[0.88rem] leading-[1.6] text-ink">
              {p}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ForCustomers() {
  return (
    <Section className="bg-sand">
      <div className="max-w-xl">
        <Eyebrow>For dine kunder</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Skab flere{" "}
          <span className="font-fraunces font-light italic">gensyn</span>.
        </h2>
        <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
          Kortet ligger i kundens Apple Wallet, altid ved hånden. Hver gang de
          åbner telefonen, er du der. Sådan skaber du kunder, der kommer igen.
        </p>
      </div>

      <div className="mt-16 grid items-center gap-14 md:grid-cols-2 md:gap-16">
        <RelationshipGraphic />
        <div className="flex flex-col gap-10">
          <Benefits label="For dine kunder" items={CUSTOMER} />
          <Benefits label="For din forretning" items={BUSINESS} />
        </div>
      </div>
    </Section>
  );
}
