// ─────────────────────────────────────────────────────────────────────
// Denne side maa ALDRIG indeholde hardcodede systemvaerdier. Alt hentes fra
// system-config (faste tal) eller databasen (butikkens indstillinger), saa
// guiden altid afspejler den faktiske adfaerd. Ingen tekniske ord i teksten.
// ─────────────────────────────────────────────────────────────────────
import type { GuideData } from "@/lib/guide";
import {
  STAMP_TOKEN_TTL_SECONDS,
  PIN_MAX_ATTEMPTS,
  PIN_LOCK_SECONDS,
} from "@/lib/system-config";
import { formatCooldown, formatMinutes, formatDkDate } from "@/lib/utils";

function codeRefreshText(seconds: number): string {
  if (seconds === 60) return "hvert minut";
  if (seconds < 60) return `hvert ${seconds}. sekund`;
  return `hvert ${Math.round(seconds / 60)}. minut`;
}

function cooldownSentence(min: number): string {
  if (min <= 0) {
    return "Kunden kan få et stempel hver gang. Der er ingen ventetid.";
  }
  return `Kunden kan selv hente ét stempel ad gangen hver ${formatCooldown(min)}.`;
}

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
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" />
    </svg>
  );
}
function IconScan() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      <path d="M12 3l9 5-9 5-9-5 9-5Z" /><path d="M3 12l9 5 9-5" /><path d="M3 16l9 5 9-5" />
    </svg>
  );
}

// ── Byggeklodser ─────────────────────────────────────────────────────
function BigCard({ icon, title, steps }: { icon: React.ReactNode; title: string; steps: string[] }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-fog bg-white p-7">
      <div className="flex items-center gap-3 text-moss">
        {icon}
        <h3 className="text-[1.25rem] font-[400] leading-tight text-ink">{title}</h3>
      </div>
      <ol className="flex flex-col gap-3.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss/10 text-[0.95rem] font-[500] text-moss">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[1.05rem] leading-[1.5] text-ink">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-[1.4rem] font-[400] tracking-[0.01em] text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Way({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-fog bg-white p-6">
      <div className="flex items-center gap-2.5 text-moss">
        {icon}
        <h3 className="text-[1.1rem] font-[500] text-ink">{title}</h3>
      </div>
      <div className="mt-3 space-y-2 text-[1.05rem] leading-[1.6] text-stone">{children}</div>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-fog pb-4 last:border-0">
      <p className="text-[1.05rem] font-[500] text-ink">{q}</p>
      <p className="mt-1.5 text-[1.05rem] leading-[1.6] text-stone">{a}</p>
    </div>
  );
}

// ── Selve guiden ─────────────────────────────────────────────────────
export function GuideContent({ data }: { data: GuideData }) {
  const cooldownText = formatCooldown(data.cooldownMin);
  const refresh = codeRefreshText(STAMP_TOKEN_TTL_SECONDS);
  const lockText = formatMinutes(PIN_LOCK_SECONDS);
  const cardHome = data.walletEnabled
    ? "i kundens Apple Wallet"
    : "på kundens telefon";

  return (
    <div className="flex flex-col gap-12">
      <p className="max-w-2xl text-[1.15rem] leading-[1.6] text-stone">
        Kunderne samler stempler på et kort, der ligger {cardHome}. Kortet er
        fuldt efter {data.stampsRequired} stempler, og så får kunden:{" "}
        <span className="font-[500] text-ink">{data.rewardText}</span>. Her er
        alt, du skal vide.
      </p>

      {/* 1. De tre situationer ved kassen */}
      <Section title="De tre situationer ved kassen">
        <p className="-mt-2 text-[1.05rem] leading-[1.6] text-stone">
          Det er stort set alt, du møder i hverdagen. Find den, kunden vil have,
          og følg de tre trin.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <BigCard
            icon={<IconStamp />}
            title="Ét stempel"
            steps={[
              "Vis skærmen med koden til kunden.",
              "Kunden scanner den med sit kamera.",
              "Stemplet lander med det samme.",
            ]}
          />
          <BigCard
            icon={<IconLayers />}
            title="Flere stempler"
            steps={[
              "Åbn Stempel, vælg Scan kort.",
              "Scan kundens kort.",
              "Tryk Giv stempel én gang pr. vare.",
            ]}
          />
          <BigCard
            icon={<IconGift />}
            title="Indløs belønning"
            steps={[
              "Scan kundens fyldte kort.",
              "Tast jeres PIN og tryk Indløs.",
              "Kortet starter forfra af sig selv.",
            ]}
          />
        </div>
      </Section>

      {/* 2. De to måder at give et stempel på */}
      <Section title="De to måder at give et stempel på">
        <div className="grid gap-5 md:grid-cols-2">
          <Way icon={<IconPhone />} title="Kunden scanner selv">
            <p>
              Vis skærmen med koden. Kunden scanner den med sit eget kamera, og
              stemplet lander af sig selv.
            </p>
            <p>
              Bruges til{" "}
              <span className="font-[500] text-ink">ét stempel</span>. Koden
              skifter {refresh}, og {cooldownSentence(data.cooldownMin)}
            </p>
          </Way>
          <Way icon={<IconScan />} title="Du scanner kundens kort">
            <p>
              Åbn Stempel, vælg Scan kort, scan kundens kort, og tryk Giv
              stempel.
            </p>
            <p>
              Bruges til{" "}
              <span className="font-[500] text-ink">flere stempler</span> og til
              at indløse. Her bestemmer du selv.
            </p>
          </Way>
        </div>
        <div className="rounded-lg border border-moss/30 bg-moss/5 p-5 text-[1.05rem] leading-[1.6] text-ink">
          <span className="font-[500]">
            Hvad gør jeg, hvis kunden vil have flere stempler?
          </span>{" "}
          Brug Scan kort og tryk Giv stempel én gang for hver vare. Køber kunden
          tre kaffe, trykker du tre gange. Kundens egen scanning af skærmen giver
          kun ét stempel ad gangen.
        </div>
      </Section>

      {/* 3. Indløsning */}
      <Section title="Sådan indløser du en belønning">
        <div className="rounded-lg border border-fog bg-white p-6">
          <ol className="flex flex-col gap-3.5">
            {[
              "Kundens kort er fuldt og siger vis ved kassen.",
              "Åbn Stempel og vælg Scan kort.",
              "Scan kundens kort.",
              "Tast jeres personale-PIN og tryk Indløs.",
              "Kunden får sin belønning, og kortet starter forfra af sig selv.",
            ].map((s, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss/10 text-[0.95rem] font-[500] text-moss">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[1.05rem] leading-[1.5] text-ink">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-fog pt-4 text-[1rem] leading-[1.6] text-stone">
            Taster du den forkerte PIN {PIN_MAX_ATTEMPTS} gange, låser indløsning
            i {lockText}. Så vent lidt, og prøv igen.
          </p>
        </div>
      </Section>

      {/* 4. Når noget driller */}
      <Section title="Når noget driller">
        <div className="rounded-lg border border-fog bg-white p-6">
          <div className="flex flex-col gap-4">
            <QA
              q="Der står koden er udløbet"
              a={`Kunden nåede det ikke i tide. Bed kunden scanne den nye kode på skærmen. Den skifter ${refresh}.`}
            />
            <QA
              q="Kunden har ikke et kort endnu"
              a="Når kunden scanner koden, bliver de først sendt hen for at oprette kortet. Det tager fem sekunder. Bagefter scanner de bare igen."
            />
            <QA
              q="Kunden siger jeg fik ikke stempel"
              a={`Tjek om kunden allerede har fået ét inden for de sidste ${cooldownText}. Ellers giv stemplet med Scan kort ved kassen.`}
            />
            {/* TODO: Naar et rigtigt "Find mit kort"-flow (genfind kort paa ny
                telefon via serienummer/e-mail) bygges, skal dette svar opdateres
                til at beskrive det flow. */}
            <QA
              q="Kunden har ny telefon eller kan ikke finde kortet"
              a="Opret et nyt kort til kunden, og giv de manglende stempler via Scan kort. Så er kunden i gang igen."
            />
          </div>
        </div>
      </Section>

      {/* 5. Aktive kampagner (kun hvis der er nogen) */}
      {data.campaigns.length > 0 ? (
        <Section title="Lige nu">
          <div className="flex flex-col gap-3">
            {data.campaigns.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-moss/40 bg-moss/5 p-5 text-[1.05rem] leading-[1.6] text-ink"
              >
                {c.type === "DOUBLE_STAMP" ? (
                  <>
                    <span className="font-[500]">Dobbeltstempel kører.</span> Hvert
                    stempel tæller dobbelt til og med {formatDkDate(c.endsAt)}.
                  </>
                ) : (
                  <>
                    <span className="font-[500]">Velkomstbonus kører.</span>{" "}
                    Kundens allerførste stempel tæller ekstra til og med{" "}
                    {formatDkDate(c.endsAt)}.
                  </>
                )}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 6. Kort om sikkerheden */}
      <Section title="Kort om sikkerheden">
        <div className="rounded-lg border border-fog bg-white p-6">
          <div className="flex items-start gap-3 text-moss">
            <IconShield />
            <ul className="flex flex-col gap-2 text-[1.05rem] leading-[1.6] text-ink">
              <li>Koden på skærmen skifter hele tiden.</li>
              <li>Et stempel kan ikke kopieres.</li>
              <li>Kun personalet kan indløse en belønning.</li>
            </ul>
          </div>
          <p className="mt-4 border-t border-fog pt-4 text-[1.05rem] leading-[1.6] text-stone">
            Du skal ikke holde øje med snyd. Det gør systemet.
          </p>
        </div>
      </Section>
    </div>
  );
}
