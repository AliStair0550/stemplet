import { StampCard } from "@/components/StampCard";

// Server-komponent: INGEN JavaScript. Kortet svaever (CSS) og staar 7/10 fyldt med
// et blOEdt lys-sweep (shine). Foer var dette en klient-komponent (tap-to-stamp),
// som traak StampCard + Celebration ind i forsidens INITIALE JS-bundle. Fjernet
// for hastighed, saa foerste load paa mobil er markant lettere.
export default function HeroStampCard() {
  return (
    <div className="w-full max-w-[28rem] animate-float">
      <div className="rounded-[1.4rem] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5">
        <StampCard
          businessName="Copenhagen Coffee Lab"
          logoUrl="/coffeelab.png"
          logoClassName="!h-9 opacity-90 [filter:brightness(0)_invert(1)]"
          hideName
          landscape
          primaryColor="#2A1A10"
          textColor="#F6EEE4"
          stampIcon="coffee"
          stamps={7}
          required={10}
          rewardText="10. kop er gratis"
          serial="COFFEELAB1"
          serialLabel="Coffee Lab"
          shine
        />
      </div>
    </div>
  );
}
