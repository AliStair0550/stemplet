import { Section, Eyebrow } from "@/components/ui";

type Step = { title: string; body: string };

const FIRST_VISIT: Step[] = [
  {
    title: "Scan QR-koden",
    body: "Kunden scanner skiltet ved kassen med telefonens kamera. Ingen app at hente, intet at installere.",
  },
  {
    title: "Kortet ligger i Wallet",
    body: "På fem sekunder er dit stempelkort i kundens Apple Wallet. Ingen konto, ingen tilmelding, ingen e-mail.",
  },
  {
    title: "Få det første stempel",
    body: "Kunden scanner butikkens stempel-QR, eller personalet scanner kundens kort. Det første stempel lander med det samme.",
  },
];

const EVERY_VISIT: Step[] = [
  {
    title: "Få et stempel",
    body: "Kunden scanner butikkens stempel-QR, eller personalet scanner kundens kort. Stemplet lander med det samme.",
  },
  {
    title: "Kortet tæller op af sig selv",
    body: "Tælleren stiger i Wallet, og kortet minder kunden om dig fra låseskærmen. De ser præcis, hvor tæt de er på næste gratis.",
  },
  {
    title: "Indløs ved kassen",
    body: "Fuldt kort vises ved disken. Personalet bekræfter med PIN, og kortet nulstiller til en ny runde. Ingen kan snyde.",
  },
];

function Track({
  label,
  who,
  steps,
}: {
  label: string;
  who: string;
  steps: Step[];
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="text-[0.65rem] font-[400] uppercase tracking-[0.14em] text-moss">
          {label}
        </span>
        <span className="h-px flex-1 bg-clay" />
      </div>
      <p className="mt-3 font-[200] text-[0.82rem] text-slate">{who}</p>

      <ol className="mt-8 flex flex-col gap-8">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-moss font-fraunces text-[0.95rem] font-light italic text-moss">
              {i + 1}
            </span>
            <div>
              <h3 className="font-[400] text-[1.05rem] leading-[1.4] text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-xs font-[200] text-[0.88rem] leading-[1.75] text-stone">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <Section id="sådan" className="scroll-mt-24 bg-moss/[0.05]">
      <div className="max-w-xl">
        <Eyebrow>Få flere stamkunder</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Så enkelt fungerer det.
        </h2>
        <p className="mt-4 font-[200] text-[0.95rem] leading-[1.8] text-stone">
          Ingen app, ingen tilmelding, ingen forvirring. Sådan ser det ud for
          dine kunder, fra første besøg til fast gæst.
        </p>
      </div>

      <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
        <Track
          label="Første besøg"
          who="Den nye kunde."
          steps={FIRST_VISIT}
        />
        <Track
          label="Hvert køb derefter"
          who="Den faste kunde."
          steps={EVERY_VISIT}
        />
      </div>
    </Section>
  );
}
