import { Section, Eyebrow } from "@/components/ui";
import { StampIcon } from "@/components/StampIcon";

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" />
      <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" />
      <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" />
      <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M4 12h16" />
    </svg>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Scan.",
    icon: <ScanIcon />,
    body: "Kunden scanner din QR-kode med kameraet. Kortet lander i Apple Wallet på fem sekunder.",
  },
  {
    n: "02",
    title: "Stempl.",
    icon: <StampIcon icon="coffee" className="h-6 w-6" />,
    body: "Ved hvert køb giver du et stempel fra din telefon. Det sidder fast med det samme.",
  },
  {
    n: "03",
    title: "Belønn.",
    icon: <StampIcon icon="star" className="h-6 w-6" />,
    body: "Når kortet er fuldt, er belønningen klar. Kunden viser kortet, og personalet bekræfter.",
  },
];

export default function HowItWorks() {
  return (
    <Section id="saadan" className="scroll-mt-24">
      <div className="max-w-xl">
        <Eyebrow>Sådan virker det</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Fra QR-kode til fast kunde. På tre trin.
        </h2>
      </div>

      <div className="mt-14 grid border-y border-clay md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`px-2 py-10 md:px-10 ${
              i < STEPS.length - 1
                ? "border-b border-clay md:border-b-0 md:border-r"
                : ""
            }`}
          >
            <span className="font-fraunces text-[1.6rem] font-light italic text-moss">
              {step.n}
            </span>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full border border-clay text-moss">
              {step.icon}
            </div>
            <h3 className="mt-6 font-[400] text-[1.25rem] tracking-[0.02em] text-ink">
              {step.title}
            </h3>
            <p className="mt-3 max-w-xs font-[200] text-[0.9rem] leading-[1.8] text-stone">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
