import type { Metadata } from "next";
import HeroStampCard from "@/components/marketing/HeroStampCard";
import { StampCard } from "@/components/StampCard";
import type { StampIconKey } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { PresseVideo } from "./PresseVideo";

// Unlisted marketing-/presse-side: rene, ord-frie produktbilleder (ordmaerke +
// stempelkort) i Apple-stil, til at screenshotte til LinkedIn m.m. Linkes IKKE
// nogen steder, er ikke i sitemap, og er noindex. Ingen knapper eller CTA'er.
export const metadata: Metadata = {
  title: "Stemplet",
  robots: { index: false, follow: false },
};

// Stemplet-ordmaerket som ren tekst (ikke et link), saa siden er et rent
// billed-lager. Samme maal som Wordmark: rund rust-prik, 29% af font-size.
function Mark({
  tone = "ink",
  className,
}: {
  tone?: "ink" | "light";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-bold leading-none tracking-[-0.045em]",
        tone === "light" ? "text-parchment" : "text-ink",
        className,
      )}
    >
      Stemplet
      <span
        aria-hidden
        className="ml-[0.1em] inline-block rounded-full bg-terracotta"
        style={{ width: "0.29em", height: "0.29em" }}
      />
    </span>
  );
}

// Farve-temaer til produktbillederne (ikke rigtige kunder).
const THEMES = [
  {
    name: "Nord Kaffebar",
    primary: "#23150E",
    text: "#F4E9DD",
    icon: "coffee" as const,
    reward: "10. kop gratis",
    stamps: 6,
    required: 10,
  },
  {
    name: "Klip & Co",
    primary: "#1E3A33",
    text: "#E7F1EC",
    icon: "scissors" as const,
    reward: "10. klip gratis",
    stamps: 4,
    required: 10,
  },
  {
    name: "Bageriet",
    primary: "#3A2A16",
    text: "#F6ECDA",
    icon: "croissant" as const,
    reward: "Gratis brød",
    stamps: 7,
    required: 8,
  },
];

const WALL = [
  { name: "Café Sol", primary: "#2A1A10", text: "#F6EEE4", icon: "coffee" as const, reward: "10. kop gratis", stamps: 3, required: 10 },
  { name: "Salon Ro", primary: "#26202B", text: "#EFE9F1", icon: "heart" as const, reward: "Gratis behandling", stamps: 8, required: 12 },
  { name: "Grønt & Godt", primary: "#173029", text: "#E6F0EB", icon: "star" as const, reward: "5. gang -25%", stamps: 4, required: 5 },
  { name: "Bagværk", primary: "#3A2A16", text: "#F6ECDA", icon: "croissant" as const, reward: "Gratis brød", stamps: 5, required: 8 },
  { name: "Klip", primary: "#1E3A33", text: "#E7F1EC", icon: "scissors" as const, reward: "10. klip gratis", stamps: 9, required: 10 },
  { name: "Iskiosken", primary: "#1C2433", text: "#E8ECF3", icon: "heart" as const, reward: "Gratis is", stamps: 2, required: 6 },
];

type CardTheme = {
  name: string;
  primary: string;
  text: string;
  icon: StampIconKey;
  reward: string;
  stamps: number;
  required: number;
};

// Genbrugelig "vifte"-sektion (samme stil som sektion 3): tre kort, det midterste
// fremhaevet foran. Bruges til de ekstra varianter. Roerer ikke sektion 3.
function FanCard({
  t,
  shine,
  className,
}: {
  t: CardTheme;
  shine?: boolean;
  className?: string;
}) {
  return (
    <StampCard
      businessName={t.name}
      primaryColor={t.primary}
      textColor={t.text}
      stampIcon={t.icon}
      stamps={t.stamps}
      required={t.required}
      rewardText={t.reward}
      shine={shine}
      className={className}
    />
  );
}

function FanSection({
  left,
  center,
  right,
  className,
}: {
  left: CardTheme;
  center: CardTheme;
  right: CardTheme;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[900px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.05] blur-[130px]"
      />
      <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
      <div className="relative mt-16 flex flex-wrap items-center justify-center gap-8 md:mt-20 md:flex-nowrap md:gap-0">
        <FanCard
          t={left}
          className="w-[15rem] rotate-[-7deg] shadow-hero md:mr-[-2.5rem] md:w-[16rem]"
        />
        <FanCard
          t={center}
          shine
          className="relative z-10 w-[16.5rem] shadow-hero md:w-[18rem]"
        />
        <FanCard
          t={right}
          className="w-[15rem] rotate-[7deg] shadow-hero md:ml-[-2.5rem] md:w-[16rem]"
        />
      </div>
    </section>
  );
}

export default function PresseKitPage() {
  return (
    <main className="bg-parchment">
      {/* 1. Hero, lyst: ordmaerke + hero-stempelkortet, masser af luft */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.08] blur-[140px]"
        />
        <Mark className="relative text-[2.4rem] md:text-[3rem]" />
        <div className="relative mt-16 flex justify-center md:mt-20">
          <HeroStampCard />
        </div>
      </section>

      {/* 2. Hero, moerkt: samme kort paa en dyb, varm keynote-baggrund */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1c1917] to-[#0e0c0b] px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[680px] w-[680px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.16] blur-[150px]"
        />
        <Mark tone="light" className="relative text-[2.4rem] md:text-[3rem]" />
        <div className="relative mt-16 flex justify-center md:mt-20">
          <HeroStampCard />
        </div>
      </section>

      {/* 3. Tre temaer: viser at kortet tilpasses butikkens brand */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sand px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[900px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.05] blur-[130px]"
        />
        <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
        <div className="relative mt-16 flex flex-wrap items-center justify-center gap-8 md:mt-20 md:flex-nowrap md:gap-0">
          <StampCard
            businessName={THEMES[0].name}
            primaryColor={THEMES[0].primary}
            textColor={THEMES[0].text}
            stampIcon={THEMES[0].icon}
            stamps={THEMES[0].stamps}
            required={THEMES[0].required}
            rewardText={THEMES[0].reward}
            className="w-[15rem] rotate-[-7deg] shadow-hero md:mr-[-2.5rem] md:w-[16rem]"
          />
          <StampCard
            businessName={THEMES[1].name}
            primaryColor={THEMES[1].primary}
            textColor={THEMES[1].text}
            stampIcon={THEMES[1].icon}
            stamps={THEMES[1].stamps}
            required={THEMES[1].required}
            rewardText={THEMES[1].reward}
            shine
            className="relative z-10 w-[16.5rem] shadow-hero md:w-[18rem]"
          />
          <StampCard
            businessName={THEMES[2].name}
            primaryColor={THEMES[2].primary}
            textColor={THEMES[2].text}
            stampIcon={THEMES[2].icon}
            stamps={THEMES[2].stamps}
            required={THEMES[2].required}
            rewardText={THEMES[2].reward}
            className="w-[15rem] rotate-[7deg] shadow-hero md:ml-[-2.5rem] md:w-[16rem]"
          />
        </div>
      </section>

      {/* 3b. Vifte: Nord Kaffebar, Little Brother (pizzeria, midt), Bageriet */}
      <FanSection
        className="bg-sand"
        left={{
          name: "Nord Kaffebar",
          primary: "#23150E",
          text: "#F4E9DD",
          icon: "coffee",
          reward: "10. kop gratis",
          stamps: 6,
          required: 10,
        }}
        center={{
          name: "Little Brother",
          primary: "#14392B",
          text: "#EAF3EE",
          icon: "pizza",
          reward: "10. pizza gratis",
          stamps: 7,
          required: 10,
        }}
        right={{
          name: "Bageriet",
          primary: "#3A2A16",
          text: "#F6ECDA",
          icon: "croissant",
          reward: "Gratis brød",
          stamps: 7,
          required: 8,
        }}
      />

      {/* 3c. Vifte: friske farver (grOn, vin, navy) */}
      <FanSection
        className="bg-gradient-to-b from-[#faf8f4] to-[#efe7dd]"
        left={{
          name: "Grønt & Godt",
          primary: "#173029",
          text: "#E6F0EB",
          icon: "leaf",
          reward: "5. gang -25%",
          stamps: 4,
          required: 5,
        }}
        center={{
          name: "Vinbaren",
          primary: "#3A151C",
          text: "#F5E3E7",
          icon: "wine",
          reward: "Gratis glas",
          stamps: 6,
          required: 10,
        }}
        right={{
          name: "Iskiosken",
          primary: "#1C2433",
          text: "#E8ECF3",
          icon: "icecream",
          reward: "Gratis is",
          stamps: 5,
          required: 6,
        }}
      />

      {/* 4. Beloenning klar: eet fuldt kort, taet paa */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf8f4] to-[#efe7dd] px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.10] blur-[130px]"
        />
        <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
        <div className="relative mt-16 flex justify-center md:mt-20">
          <StampCard
            businessName="Nord Kaffebar"
            primaryColor="#23150E"
            textColor="#F4E9DD"
            stampIcon="coffee"
            stamps={10}
            required={10}
            rewardText="10. kop er gratis"
            shine
            className="w-full max-w-[24rem]"
          />
        </div>
      </section>

      {/* 5. Kort-vaeg: mange butikker, mange brands */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-parchment px-6 py-24">
        <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
        <div className="relative mt-14 grid w-full max-w-4xl grid-cols-2 gap-5 md:mt-16 md:grid-cols-3 md:gap-7">
          {WALL.map((c) => (
            <StampCard
              key={c.name}
              businessName={c.name}
              primaryColor={c.primary}
              textColor={c.text}
              stampIcon={c.icon}
              stamps={c.stamps}
              required={c.required}
              rewardText={c.reward}
              className="w-full shadow-card"
            />
          ))}
        </div>
      </section>

      {/* 6. Video (kaffe): downloadbar animation (scan -> kort -> tilfoej -> Wallet) */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf8f4] to-[#efe7dd] px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.08] blur-[130px]"
        />
        <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
        <div className="relative mt-12 md:mt-14">
          <PresseVideo variant="coffee" />
        </div>
      </section>

      {/* 7. Video (pizza): samme animation, pizzeria-eksempel */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf8f4] to-[#efe7dd] px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.08] blur-[130px]"
        />
        <Mark className="relative text-[1.9rem] md:text-[2.2rem]" />
        <div className="relative mt-12 md:mt-14">
          <PresseVideo variant="pizza" />
        </div>
      </section>
    </main>
  );
}
