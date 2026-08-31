"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StampIconKey } from "@/lib/brand";
import { AddEmployeeButton } from "./AddEmployeeButton";
import { AddToHomeButton } from "./AddToHomeButton";
import { TryStampDemo } from "./TryStampDemo";
import { CtaArrow, IconDevice, IconQr, IconShare, IconStampMark } from "./icons";

type Props = {
  businessName: string;
  cardUrl: string;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  logoScale?: number;
  stampIcon: StampIconKey;
  stampsRequired: number;
  rewardText: string;
  showPoweredBy: boolean;
  serialLabel: string;
  // Live-tal, saa tjeklisten krydser af af sig selv, efterhaanden som butikken
  // kommer i gang.
  deviceCount: number;
  totalCustomers: number;
  stampsTotal: number;
};

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M5 12.5l4.2 4.2L19 6.5" />
    </svg>
  );
}

// Eet guidet skridt. En hel-klikbar boks (link eller inline-handling), saa det
// er nemt at komme videre.
function ActionCard({
  icon,
  title,
  body,
  cta,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  cta: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-fog bg-white p-5 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="font-[400] text-[1rem] text-ink">{title}</h4>
        <p className="mt-0.5 font-[300] text-[0.83rem] leading-relaxed text-stone">
          {body}
        </p>
      </div>
      <div className="mt-1">{cta}</div>
    </div>
  );
}

export function GettingStarted(props: Props) {
  const steps = [
    { label: "Kortet er oprettet", done: true },
    { label: "QR-koden er klar", done: true },
    { label: "Første medarbejder er tilføjet", done: props.deviceCount > 0 },
    {
      label: "Første kunde har hentet kortet",
      done: props.totalCustomers > 0,
    },
    { label: "Første stempel er givet", done: props.stampsTotal > 0 },
  ];
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / total) * 100);
  const allDone = doneCount === total;

  // Dopamin: lad baren fylde op fra 0 ved indlaesning.
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex flex-col gap-8">
      {/* Kort + fremdrift: her ser man et klart kort og butik, og hvor langt
          man er. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start">
        <TryStampDemo
          businessName={props.businessName}
          serialLabel={props.serialLabel}
          primaryColor={props.primaryColor}
          textColor={props.textColor}
          stampIcon={props.stampIcon}
          stampsRequired={props.stampsRequired}
          rewardText={props.rewardText}
          logoUrl={props.logoUrl}
          logoScale={props.logoScale ?? 1}
          showPoweredBy={props.showPoweredBy}
        />

        <div className="flex flex-col rounded-lg border border-fog bg-white p-6 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-[400] text-[1.15rem] text-ink">
              {allDone ? "I er i gang" : "Din vej til første stempel"}
            </h2>
            <span className="shrink-0 text-[0.82rem] font-[400] tabular-nums text-terracotta">
              {doneCount}/{total}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-fog">
            <div
              className="h-full rounded-full bg-terracotta transition-[width] duration-700 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                    s.done
                      ? "bg-terracotta text-parchment"
                      : "border border-clay bg-white",
                  )}
                >
                  {s.done ? <Check /> : null}
                </span>
                <span
                  className={cn(
                    "text-[0.88rem] font-[300]",
                    s.done ? "text-stone line-through decoration-clay" : "text-ink",
                  )}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Guidede handlinger: gør det nu */}
      <div>
        <SectionHeader title="Gør butikken klar" />
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            icon={<IconQr />}
            title="Del dit kort"
            body="Del kortet online, og hent QR-koden så kunderne kan scanne den."
            cta={
              <Link
                href="/app/kampagner"
                className={`${btnClass("outline")} w-full`}
              >
                Del dit kort
              </Link>
            }
          />
          <ActionCard
            icon={<IconDevice />}
            title="Tilføj en medarbejder"
            body="Lad personalet stemple fra deres egen telefon eller en iPad."
            cta={
              <AddEmployeeButton
                label="Tilføj medarbejder"
                className={`${btnClass("outline")} w-full disabled:opacity-60`}
              />
            }
          />
          <ActionCard
            icon={<IconShare />}
            title="Se kundens oplevelse"
            body="Prøv præcis det, kunderne møder, når de scanner koden."
            cta={
              <a
                href={props.cardUrl}
                target="_blank"
                rel="noreferrer"
                className={`${btnClass("outline")} w-full`}
              >
                Se kundens side
              </a>
            }
          />
          <ActionCard
            icon={<IconStampMark />}
            title="Giv det første stempel"
            body="Åbn kassen, og scan et kort for at give et stempel."
            cta={
              <Link
                href="/app/kasse"
                className={`${btnClass("primary")} w-full`}
              >
                Giv et stempel
                <CtaArrow />
              </Link>
            }
          />
        </div>
      </div>

      <AddToHomeButton />
    </div>
  );
}
