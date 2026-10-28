"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { StampIcon } from "@/components/StampIcon";
import { QrCode } from "./MemberCard";

// Historien om Emma: fra foerste scanning til den gratis kop. Telefonen staar
// fast, mens man scroller gennem kapitlerne, og kortet i den skifter tilstand.
// Uden JavaScript (eller ved "reducér bevægelse") ses blot kapitlerne og det
// foerste kort.

type Chapter = {
  kicker: string;
  title: string;
  text: string;
  stamps: number;
  title2: string;
  foot: { label: string; value: string };
  note?: { from: string; text: string };
  ready?: boolean;
};

const CHAPTERS: Chapter[] = [
  {
    kicker: "Første besøg",
    title: "Emma scanner koden ved kassen.",
    text: "Hun skriver sit navn og sin e-mail og trykker Hent. Ingen app og ingen adgangskode. Kortet er hendes på få sekunder.",
    stamps: 0,
    title2: "Velkommen, Emma",
    foot: { label: "Belønning", value: "10. kop er gratis" },
  },
  {
    kicker: "I hendes Wallet",
    title: "Kortet ligger ved siden af betalingskortet.",
    text: "Med dit billede, dit navn og dine farver. Hun får sit første stempel, og kortet opdaterer sig selv.",
    stamps: 1,
    title2: "Stamkunde",
    foot: { label: "Belønning", value: "10. kop er gratis" },
    note: { from: "Kaffestuen", text: "Dit første stempel er på kortet. Ni mere, så er kaffen på os." },
  },
  {
    kicker: "Hun kommer igen",
    title: "Og igen. Og igen.",
    text: "Personalet scanner hendes kort, og stemplet lander med det samme. Du kan se, hvem der kommer igen, uge for uge.",
    stamps: 7,
    title2: "Stamkunde",
    foot: { label: "Belønning", value: "10. kop er gratis" },
  },
  {
    kicker: "Hun tager en veninde med",
    title: "Louise får rabat. Emma får en kop.",
    text: "Emma deler sin kode fra kortet. Louise får rabat ved sit første besøg, og når hun har været der, får Emma sin belønning.",
    stamps: 8,
    title2: "Stamkunde",
    foot: { label: "Til gode", value: "1 gratis kop" },
    note: { from: "Kaffestuen", text: "Louise har været her. Du har en gratis kop til gode." },
  },
  {
    kicker: "Den tiende kop",
    title: "Belønningen er klar.",
    text: "Personalet løser den ind med sin PIN. Kunden kan ikke selv, og ingen kan stemple sig selv. Så starter et nyt kort.",
    stamps: 10,
    title2: "Klar til dig",
    foot: { label: "Belønning", value: "10. kop er gratis" },
    ready: true,
  },
];

function PhoneCard({ c }: { c: Chapter }) {
  return (
    <div className="relative aspect-[1/1.42] overflow-hidden rounded-[22px] bg-[#14110F] text-white kk-shadow-3">
      <Image src="/kundekort/cafe.webp" alt="" fill sizes="320px" className="object-cover object-[60%_50%]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#14110F]/70 via-[#14110F]/10 to-[#14110F]/95" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#14110F]">
            <StampIcon icon="coffee" className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[16px] font-semibold tracking-[-0.02em]">Kaffestuen</span>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-white/70">Stempler</p>
          <p className="text-[14px] font-semibold leading-tight tabular-nums">{c.stamps} af 10</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 grid gap-3 p-4">
        <div>
          <p className="text-[24px] font-semibold leading-none tracking-[-0.03em]">{c.title2}</p>
          <div className="mt-2.5 flex gap-1.5" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="kk-bar h-[7px] flex-1 rounded-full"
                style={{
                  background: i < c.stamps ? (c.ready ? "#7CC4FF" : "#fff") : "rgba(255,255,255,.25)",
                  transform: i === c.stamps - 1 ? "scaleY(1.5)" : undefined,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-white/70">{c.foot.label}</p>
            <p className="text-[14px] font-semibold leading-tight">{c.foot.value}</p>
          </div>
          <div className="h-[78px] w-[78px] shrink-0 rounded-[11px] bg-white p-1.5">
            <QrCode />
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone({ c }: { c: Chapter }) {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[330px] px-4">
      <div className="kk-beam" />
      <div className="kk-phone">
        <div className="kk-phone-screen">
          <div className="kk-phone-island" />
          <div className="absolute inset-x-7 top-4 flex justify-between text-xs font-semibold text-[#0B1628]">
            <span>7.42</span>
            <span>5G</span>
          </div>
          <div className="absolute inset-0 px-3 pt-14">
            <PhoneCard c={c} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[16px] bg-white px-3 py-2.5 kk-shadow-1">
                <p className="text-[12.5px] font-semibold leading-tight">{c.ready ? "Indløs" : "Fordele"}</p>
                <p className="truncate text-[11px] text-[#5F6B7E]">{c.ready ? "Vis kortet ved kassen" : "Gratis 10. kop"}</p>
              </div>
              <div className="rounded-[16px] bg-white px-3 py-2.5 kk-shadow-1">
                <p className="text-[12.5px] font-semibold leading-tight">Henvis en ven</p>
                <p className="truncate text-[11px] text-[#5F6B7E]">Kode EMMA-K7</p>
              </div>
            </div>
          </div>
          {/* Beskeden glider ned fra toppen, naar kapitlet har en. */}
          <div
            className="kk-swap absolute inset-x-3 top-12 z-[4] rounded-[18px] bg-white/85 p-3 backdrop-blur-xl kk-shadow-3"
            style={{ opacity: c.note ? 1 : 0, transform: c.note ? "none" : "translateY(-16px)" }}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[#061C3D] text-white">
                <StampIcon icon="coffee" className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12.5px] font-semibold text-[#0B1628]">{c.note?.from ?? "Kaffestuen"}</span>
              <span className="ml-auto text-[11px] text-[#5F6B7E]">nu</span>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-[#384354]">{c.note?.text ?? ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Story() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      // Et kapitel er aktivt, naar det krydser midten af skaermen.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const c = CHAPTERS[active]!;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="sticky top-0 z-10 -mx-4 bg-gradient-to-b from-[#F2F5F9] from-80% to-transparent px-4 pb-6 pt-4 lg:top-16 lg:mx-0 lg:self-start lg:bg-none lg:p-0">
        <div className="mx-auto w-[330px] max-w-full [zoom:0.6] sm:[zoom:0.72] lg:w-full lg:[zoom:1]">
          <Phone c={c} />
        </div>
        <div className="mt-4 flex justify-center gap-1.5 lg:hidden" aria-hidden>
          {CHAPTERS.map((_, i) => (
            <span key={i} className="kk-bar h-1.5 rounded-full" style={{ width: i === active ? 22 : 6, background: i === active ? "#061C3D" : "#CAD2DD" }} />
          ))}
        </div>
      </div>

      <ol className="grid">
        {CHAPTERS.map((ch, i) => (
          <li
            key={ch.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            data-active={i === active}
            className="kk-step flex min-h-[62vh] flex-col justify-center py-10 lg:min-h-[78vh]"
          >
            <p className="text-[13px] font-semibold text-[#1B5EAE]">
              <span className="tabular-nums">0{i + 1}</span>
              <span className="mx-2 text-[#CAD2DD]">/</span>
              {ch.kicker}
            </p>
            <h3 className="mt-3 max-w-[16ch] text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em]">
              {ch.title}
            </h3>
            <p className="mt-4 max-w-[46ch] text-[1.05rem] leading-relaxed text-[#5F6B7E]">{ch.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
