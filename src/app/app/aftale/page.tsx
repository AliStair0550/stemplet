import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getAgreementView } from "@/lib/billing";
import { PageHeading } from "@/components/dash";
import { formatDkDate, formatDkNumber } from "@/lib/utils";
import { ApproveButton } from "./ApproveButton";

export const metadata: Metadata = { title: "Pro-aftale" };
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
        className="mt-[3px] h-4 w-4 shrink-0 text-moss"
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

  const subtitle = v.approved
    ? "Aftalen er godkendt. Alt fortsætter præcis som i dag."
    : v.overLimit
      ? `I er over ${v.limit} kortholdere. Godkend Pro-aftalen, så er alt på plads.`
      : v.warned
        ? `I nærmer jer ${v.limit} kortholdere. Se aftalen og godkend, når det passer.`
        : `Her er jeres status og Pro-aftalen. Intet skift sker, før I krydser ${v.limit} kortholdere.`;

  const pct = Math.min(100, Math.round((v.cardholders / v.limit) * 100));
  const special = v.priceKr !== v.standardPriceKr;

  return (
    <>
      <PageHeading title="Pro-aftale" subtitle={subtitle} />

      <div className="flex max-w-xl flex-col gap-6">
        {/* Status: kortholdere */}
        <section className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-moss">
                Kortholdere
              </span>
              <p className="mt-1 font-[300] text-[1.6rem] leading-none text-ink">
                <span className="tabular-nums">
                  {formatDkNumber(v.cardholders)}
                </span>{" "}
                <span className="text-[1rem] text-slate">af {v.limit}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-fog">
            <div
              className="h-full rounded-full bg-moss transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 font-[300] text-[0.82rem] leading-relaxed text-slate">
            En kortholder er ét stempelkort hos jer. Gratis op til {v.limit}.
          </p>
        </section>

        {/* Aftalen */}
        <section className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
          <h2 className="font-[300] text-[1.3rem] text-ink">Pro-aftalen</h2>
          <ul className="mt-5 flex flex-col gap-3.5">
            <Term>
              <span className="font-[400] text-ink">
                {formatDkNumber(v.priceKr)} kr. per måned ekskl. moms
              </span>
              {special ? (
                <span className="text-slate">
                  {" "}
                  (jeres aftalte pris; standardprisen er {v.standardPriceKr} kr.)
                </span>
              ) : null}
            </Term>
            <Term>Månedsvis faktura, forud</Term>
            <Term>Ingen binding: opsig når som helst</Term>
            <Term>
              Betaling starter først den dag, I krydser {v.limit} kortholdere
            </Term>
            <Term>Ingen betalingsmur: intet stopper undervejs</Term>
          </ul>

          <div className="mt-7 border-t border-fog pt-6">
            {v.approved ? (
              <div className="rounded-lg border border-moss bg-moss/5 px-5 py-4">
                <p className="font-[400] text-[0.95rem] text-ink">
                  Aftale godkendt
                </p>
                <p className="mt-1 font-[300] text-[0.85rem] text-stone">
                  Godkendt{" "}
                  {v.approvedAt ? formatDkDate(v.approvedAt) : ""}. I skal ikke
                  gøre mere. Faktura sendes månedsvis, når I er over {v.limit}{" "}
                  kortholdere.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="font-[300] text-[0.88rem] leading-relaxed text-stone">
                  Ved at godkende accepterer I Pro-aftalen ovenfor. I har allerede
                  sagt ja til prismodellen i handelsbetingelserne ved oprettelsen,
                  så det er blot en bekræftelse. Godkendelsen noteres med
                  tidspunkt.
                </p>
                <ApproveButton />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
