import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getAgreementView } from "@/lib/billing";
import { PageHeading } from "@/components/dash";
import { formatDkDate, formatDkNumber } from "@/lib/utils";
import { ApproveButton } from "./ApproveButton";
import { CancelBox } from "./CancelBox";

export const metadata: Metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

function Term({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-[3px] h-4 w-4 shrink-0 text-terracotta"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span className="font-[300] text-[0.9rem] leading-relaxed text-stone">
        {children}
      </span>
    </li>
  );
}

export default async function AftalePage() {
  const { business } = await requireBusiness();
  const v = await getAgreementView(business.id);
  const endsOn = formatDkDate(v.trialEndsAt);

  const lastDay = formatDkDate(v.lastDay);
  const subtitle = v.cancelledAt
    ? `Abonnementet er opsagt. Dit kort kører til og med ${lastDay}.`
    : v.approved
    ? "Abonnementet er bekræftet. Alt kører videre som i dag."
    : v.inTrial
      ? `Du har gratis adgang til og med ${endsOn}. Derefter ${v.priceKr} kr. om måneden ekskl. moms.`
      : "De gratis måneder er gået. Bekræft abonnementet, så er alt på plads.";

  // Fremgang gennem de tre gratis maaneder (ca. 91 dage).
  const pct = v.inTrial ? Math.max(4, Math.min(100, Math.round(((91 - v.trialDaysLeft) / 91) * 100))) : 100;
  const special = v.priceKr !== v.standardPriceKr;

  return (
    <>
      <PageHeading title="Abonnement" subtitle={subtitle} />

      <div className="flex max-w-xl flex-col gap-6">
        {/* Status: de gratis maaneder */}
        <section className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
          <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">Gratis periode</span>
          <p className="mt-1 font-[300] text-[1.6rem] leading-none text-ink">
            {v.inTrial ? (
              <>
                <span className="tabular-nums">{formatDkNumber(v.trialDaysLeft)}</span>{" "}
                <span className="text-[1rem] text-slate">{v.trialDaysLeft === 1 ? "dag tilbage" : "dage tilbage"}</span>
              </>
            ) : (
              <span className="text-[1.2rem]">Slut {endsOn}</span>
            )}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-fog">
            <div className="h-full rounded-full bg-terracotta transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 font-[300] text-[0.82rem] leading-relaxed text-slate">
            Tre måneder gratis, til og med {endsOn}. Du har {formatDkNumber(v.cardholders)}{" "}
            {v.cardholders === 1 ? "kortholder" : "kortholdere"}, og der er ingen grænse.
          </p>
        </section>

        {/* Abonnementet */}
        <section className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
          <h2 className="font-[300] text-[1.3rem] text-ink">Folka Kort</h2>
          <ul className="mt-5 flex flex-col gap-3.5">
            <Term>
              <span className="font-[400] text-ink">{formatDkNumber(v.priceKr)} kr. om måneden ekskl. moms</span>
              {special ? <span className="text-slate"> (din aftalte pris; standardprisen er {v.standardPriceKr} kr.)</span> : null}
            </Term>
            <Term>De første tre måneder er gratis</Term>
            <Term>Stempler, henvisninger og beskeder. Ubegrænset antal kortholdere</Term>
            <Term>Faktura månedsvis, forud</Term>
            <Term>Ingen binding. Opsig når som helst</Term>
            <Term>Intet lukker undervejs</Term>
          </ul>

          {v.cancelledAt ? null : (
            <div className="mt-7 border-t border-fog pt-6">
              {v.approved ? (
                <div className="rounded-lg border border-terracotta bg-terracotta/5 px-5 py-4">
                  <p className="font-[400] text-[0.95rem] text-ink">Abonnement bekræftet</p>
                  <p className="mt-1 font-[300] text-[0.85rem] text-stone">
                    Bekræftet {v.approvedAt ? formatDkDate(v.approvedAt) : ""}. Du skal ikke gøre mere. Første faktura kommer efter de gratis måneder.
                  </p>
                </div>
              ) : v.inTrial ? (
                // I de gratis maaneder skal ejeren ikke goere noget: bekraeftelsen
                // er frivillig og staar diskret (ikke som en stor knap, man tror, man skal trykke paa).
                <div className="flex flex-col gap-3">
                  <p className="font-[300] text-[0.88rem] leading-relaxed text-stone">
                    Du skal ikke gøre noget. Alt kører videre efter de gratis måneder, og første faktura kommer efter {endsOn}.
                  </p>
                  <ApproveButton quiet />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="font-[300] text-[0.88rem] leading-relaxed text-stone">
                    Bekræft, så fortsætter alt som i dag. Du sagde ja til prisen, da du oprettede kortet.
                  </p>
                  <ApproveButton />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Opsig: synligt her, hvor man leder efter det. Ali faar en mail. */}
        <section className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
          <h2 className="font-[300] text-[1.3rem] text-ink">Opsig abonnementet</h2>
          <div className="mt-4">
            <CancelBox cancelled={!!v.cancelledAt} lastDay={lastDay} />
          </div>
        </section>
      </div>
    </>
  );
}
