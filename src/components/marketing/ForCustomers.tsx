import { Section, Eyebrow } from "@/components/ui";
import { StampCard } from "@/components/StampCard";

const POINTS = [
  "Ingen app at hente.",
  "Ingen konto at oprette.",
  "Kortet minder dem om dig fra låseskærmen, når de går forbi.",
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

export default function ForCustomers() {
  return (
    <Section className="bg-sand">
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
        <div>
          <Eyebrow>For dine kunder</Eyebrow>
          <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
            Dine kunder har allerede telefonen i{" "}
            <span className="font-fraunces font-light italic">hånden</span>.
          </h2>
          <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
            Nu har de også dit stempelkort. Uden noget nyt at lære og uden noget
            at installere.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3.5">
                <CheckMark />
                <span className="font-[300] text-[0.9rem] leading-[1.7] text-ink">
                  {p}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center md:justify-end">
          <StampCard
            businessName="Bageren på Torvet"
            primaryColor="#3A2A1E"
            textColor="#FFFFFF"
            stampIcon="croissant"
            stamps={6}
            required={8}
            rewardText="8. brød er gratis"
            serial="STEMPLET42"
          />
        </div>
      </div>
    </Section>
  );
}
