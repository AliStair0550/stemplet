// ─────────────────────────────────────────────────────────────────────
// Denne side maa ALDRIG indeholde hardcodede systemvaerdier. Alt hentes fra
// system-config (faste tal) eller databasen (butikkens indstillinger), saa
// guiden altid afspejler den faktiske adfaerd. Ingen tekniske ord i teksten.
// ─────────────────────────────────────────────────────────────────────
import type { GuideData } from "@/lib/guide";
import { APP_HOST, PLATFORM } from "@/lib/platform";
import { formatDkDate } from "@/lib/utils";

// ── Ikoner ───────────────────────────────────────────────────────────
function IconStamp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M15 8a3 3 0 1 0-6 0c0 1.5.5 2 .5 3H14.5c0-1 .5-1.5.5-3Z" />
      <path d="M5 16h14M4 20h16" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12M12 8S10 3 7 5s5 3 5 3ZM12 8s2-5 5-3-5 3-5 3Z" />
    </svg>
  );
}
function IconQr() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18v2M18 14h2" />
    </svg>
  );
}

// ── Byggeklodser ─────────────────────────────────────────────────────
function BigCard({ icon, title, steps }: { icon: React.ReactNode; title: string; steps: string[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-fog bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 text-terracotta">
        {icon}
        <h3 className="text-[1.2rem] font-semibold leading-tight text-ink">{title}</h3>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-[0.95rem] font-[500] text-terracotta">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[1.05rem] leading-[1.45] text-ink">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-fog pb-3 last:border-0 last:pb-0">
      <p className="text-[1.05rem] font-[500] text-ink">{q}</p>
      <p className="mt-1 text-[1rem] leading-[1.5] text-stone">{a}</p>
    </div>
  );
}

// ── Selve guiden: kort og med saa lidt tekst som muligt ──────────────
export function GuideContent({ data }: { data: GuideData }) {
  const tel = PLATFORM.supportPhone.replace(/\s/g, "");

  return (
    <div className="flex flex-col gap-8">
      <p className="text-[1.1rem] leading-[1.5] text-stone">
        Kortet er fuldt efter {data.stampsRequired} stempler. Så får kunden:{" "}
        <span className="font-[500] text-ink">{data.rewardText}</span>.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <BigCard
          icon={<IconQr />}
          title="Ny kunde"
          steps={[
            "Vis QR-skiltet.",
            "Kunden scanner og henter kortet.",
            data.walletEnabled ? "Kortet ligger i Apple Wallet." : "Kortet ligger på telefonen.",
          ]}
        />
        <BigCard
          icon={<IconStamp />}
          title="Giv stempel"
          steps={["Tryk Scan, og scan kortet.", "Vælg antal.", "Tryk Giv stempel."]}
        />
        <BigCard
          icon={<IconGift />}
          title="Indløs"
          steps={["Scan det fulde kort.", "Tast PIN, hvis I har en.", "Tryk Indløs belønning."]}
        />
      </div>

      {data.campaigns.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.campaigns.map((c, i) => (
            <p key={i} className="rounded-lg bg-terracotta/5 px-5 py-3.5 text-[1.02rem] leading-[1.5] text-ink">
              {c.type === "DOUBLE_STAMP" ? (
                <>
                  <span className="font-[500]">Dobbeltstempel kører</span> til og med {formatDkDate(c.endsAt)}.
                </>
              ) : c.type === "PICKUP_STAMP" ? (
                <>
                  <span className="font-[500]">Stempel ved afhentning kører</span> til og med {formatDkDate(c.endsAt)}.
                  Nye kort får 1 stempel med det samme.
                </>
              ) : (
                <>
                  <span className="font-[500]">Velkomstbonus kører</span> til og med {formatDkDate(c.endsAt)}. Det
                  første stempel tæller ekstra.
                </>
              )}
            </p>
          ))}
        </div>
      ) : null}

      <section className="rounded-lg border border-fog bg-white p-6 shadow-card">
        <h2 className="mb-3 text-[1.2rem] font-semibold text-ink">Når noget driller</h2>
        <div className="flex flex-col gap-3">
          <QA q="Stemplet kom ikke på" a="Scan kortet igen, og giv stemplet." />
          <QA q="Kunden får et nyt kort hver gang" a="Bed kunden lægge kortet i Apple Wallet." />
          <QA q="Ny telefon eller kortet er væk" a={`Kortet i Apple Wallet følger med. Ellers: ${APP_HOST}/find-kort.`} />
        </div>
        <p className="mt-5 border-t border-fog pt-4 text-[1.05rem] text-ink">
          Service:{" "}
          <a href={`tel:${tel}`} className="font-semibold underline underline-offset-4">
            {PLATFORM.supportPhone}
          </a>
        </p>
      </section>
    </div>
  );
}
