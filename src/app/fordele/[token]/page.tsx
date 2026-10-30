import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { cardTitle, isStampIcon, rgba, shade, type StampIconKey } from "@/lib/brand";
import { verifyMemberToken } from "@/lib/member-link";
import { loadReferralPassInfo } from "@/lib/referral-wallet";
import { owedLabel } from "@/lib/wallet/referral-fields";
import { referralShareText, firstName } from "@/lib/referral-text";
import { formatDkDate } from "@/lib/utils";
import { offerIsLive } from "@/lib/member-offers";
import { StampIcon } from "@/components/StampIcon";
import { ShareReferral } from "./ShareReferral";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Tilbud og fordele" }, robots: { index: false } };

// "Tilbud og fordele": kortholderens egen side, aabnet fra knappen under kortet
// i Wallet. Levende og mobil-foerst: status paa stempelkortet, det kunden har
// til gode, tilbud lige nu og henvis en ven (med fejring, naar man har delt).
// Animationerne respekterer "reducer bevaegelse" (globals.css).

type Offer = { title: string; text: string | null; until?: Date | null; link?: string | null };

// Indgang: sektionerne glider ind efter hinanden.
const rise = (i: number): CSSProperties => ({ animation: `fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.09}s both` });

export default async function BenefitsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const serial = verifyMemberToken(decodeURIComponent(token));
  if (!serial) notFound();
  const now = new Date();
  const cc = await prisma.customerCard.findUnique({
    where: { serial },
    include: {
      card: {
        include: {
          business: true,
          campaigns: { where: { startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { endsAt: "asc" } },
        },
      },
    },
  });
  if (!cc) notFound();
  const b = cc.card.business;
  const [referral, memberOffers] = await Promise.all([
    loadReferralPassInfo(cc, now).catch(() => null),
    prisma.memberOffer.findMany({ where: { businessId: b.id, active: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const liveOffers = memberOffers.filter((o) => offerIsLive(o, now));
  const partners = liveOffers.filter((o) => o.kind === "PARTNER");

  const shop = cardTitle(b);
  const fg = b.textColor;
  const bg = b.primaryColor;
  const icon: StampIconKey = isStampIcon(cc.card.stampIcon) ? cc.card.stampIcon : "coffee";
  const required = cc.card.stampsRequired;
  const stamps = Math.min(cc.stamps, required);
  const full = stamps >= required;
  const left = required - stamps;
  const name = firstName(cc.name);
  const reward = cc.card.rewardText;

  // Butikkens egne tilbud foerst, saa kampagner og den seneste besked.
  const offers: Offer[] = liveOffers
    .filter((o) => o.kind === "OFFER")
    .map((o) => ({ title: o.title, text: o.text, until: o.endsAt, link: o.link }));
  for (const c of cc.card.campaigns) {
    if (c.type === "DOUBLE_STAMP") offers.push({ title: "Dobbelt stempel", text: "Hvert stempel tæller dobbelt lige nu.", until: c.endsAt });
    if (c.type === "WELCOME_BONUS" && cc.lifetimeStamps === 0)
      offers.push({ title: "Velkomstbonus", text: "Dit første stempel tæller ekstra.", until: c.endsAt });
  }
  if (b.newsText && !cc.newsOptOut) offers.push({ title: `Nyt fra ${shop}`, text: b.newsText });

  const panel = { background: rgba(fg, 0.08), border: `1px solid ${rgba(fg, 0.14)}` };
  const muted = { color: rgba(fg, 0.72) };
  const label = "text-[0.72rem] font-semibold uppercase tracking-[0.12em]";
  let section = 0;

  return (
    <main
      className="min-h-[100dvh] overflow-x-hidden px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]"
      style={{
        background: `radial-gradient(ellipse 120% 45% at 50% 0%, ${rgba(fg, 0.16)} 0%, transparent 65%), linear-gradient(180deg, ${bg} 0%, ${shade(bg, -0.2)} 100%)`,
        color: fg,
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="flex flex-col items-center gap-3 pb-2 text-center" style={rise(section++)}>
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt={shop} className="h-12 w-auto max-w-[60%] object-contain" />
          ) : (
            <span className="text-[1.1rem] font-bold tracking-[-0.02em]">{shop}</span>
          )}
          <h1 className="text-[2.2rem] font-bold leading-[1.02] tracking-[-0.04em]">{name ? `Hej ${name}` : "Dine fordele"}</h1>
          <p className="max-w-[18rem] text-[0.98rem] leading-snug" style={muted}>
            Tilbud og fordele til dig som kortholder hos {shop}.
          </p>
        </header>

        {b.stampsEnabled ? (
          <section className="relative overflow-hidden rounded-[26px] p-5" style={{ ...panel, ...rise(section++) }}>
            <div className="flex items-end justify-between gap-3">
              <span className={label} style={muted}>
                Dit stempelkort
              </span>
              <span className="text-[2rem] font-bold leading-none tabular-nums tracking-[-0.04em]">
                {stamps}
                <span className="text-[1.1rem]" style={muted}>
                  /{required}
                </span>
              </span>
            </div>
            {/* Fremgang: vokser frem ved indlaesning. */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: rgba(fg, 0.14) }}>
              <div
                className="h-full origin-left rounded-full"
                style={{ width: `${(stamps / required) * 100}%`, background: fg, animation: "growWidth 1.1s cubic-bezier(0.16,1,0.3,1) 0.35s both" }}
              />
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2.5">
              {Array.from({ length: required }, (_, i) => {
                const filled = i < stamps;
                const next = i === stamps && !full;
                const last = i === required - 1;
                return (
                  <span key={i} className="relative flex aspect-square items-center justify-center">
                    {next ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${fg}`, animation: "stampRing 1.8s ease-out 1.2s infinite" }}
                      />
                    ) : null}
                    <span
                      className="flex h-full w-full items-center justify-center rounded-full"
                      style={
                        filled
                          ? { background: fg, color: bg, animation: `stampPop 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.45 + i * 0.07}s both` }
                          : { border: `1.5px ${last ? "solid" : "dashed"} ${rgba(fg, last ? 0.55 : 0.3)}`, color: rgba(fg, last ? 0.8 : 0.35) }
                      }
                    >
                      <StampIcon icon={last ? "gift" : icon} className="h-[52%] w-[52%]" />
                    </span>
                  </span>
                );
              })}
            </div>
            <p className="mt-5 text-[1.05rem] font-semibold leading-snug">
              {full
                ? `Din belønning er klar: ${reward}. Vis kortet ved kassen.`
                : left === 1
                  ? `Kun 1 stempel til ${reward.charAt(0).toLowerCase()}${reward.slice(1)}.`
                  : `${left} stempler til ${reward.charAt(0).toLowerCase()}${reward.slice(1)}.`}
            </p>
            {cc.lifetimeStamps > stamps ? (
              <p className="mt-1 text-[0.85rem]" style={muted}>
                {cc.lifetimeStamps} stempler i alt hos {shop}. Tak fordi du kommer igen.
              </p>
            ) : null}
          </section>
        ) : null}

        {referral && referral.rewards.length > 0 ? (
          <section
            className="rounded-[26px] p-5"
            style={{ background: fg, color: bg, ...rise(section++), boxShadow: `0 18px 40px -18px ${rgba(fg, 0.5)}` }}
          >
            <span className={label} style={{ color: rgba(bg, 0.65) }}>
              Til gode
            </span>
            <p className="mt-1 text-[1.9rem] font-bold leading-tight tracking-[-0.03em]">{owedLabel(referral.rewards)}</p>
            <p className="mt-1 text-[0.92rem]" style={{ color: rgba(bg, 0.75) }}>
              Fra dine henvisninger. Vis kortet ved kassen, så indløser personalet det.
            </p>
          </section>
        ) : null}

        <section className="flex flex-col gap-3" style={rise(section++)}>
          <span className={`${label} px-1 pt-2`} style={muted}>
            Tilbud lige nu
          </span>
          {offers.length > 0 ? (
            offers.map((o, i) => (
              <div
                key={o.title + (o.text ?? "")}
                className="relative overflow-hidden rounded-[22px] p-5"
                style={{
                  background: fg,
                  color: bg,
                  animation: `fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.1}s both`,
                  boxShadow: `0 18px 40px -20px ${rgba(fg, 0.55)}`,
                }}
              >
                <p className="text-[1.2rem] font-bold tracking-[-0.02em]">{o.title}</p>
                {o.text ? <p className="mt-1 text-[0.98rem] leading-snug">{o.text}</p> : null}
                {o.link ? (
                  <a href={o.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[0.9rem] font-semibold underline underline-offset-4">
                    Læs mere
                  </a>
                ) : null}
                {o.until ? (
                  <p className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.78rem] font-semibold" style={{ background: rgba(bg, 0.1) }}>
                    Til og med {formatDkDate(new Date(o.until.getTime() - 1))}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[22px] p-5 text-[0.95rem] leading-snug" style={panel}>
              Ingen særlige tilbud lige nu. Du får besked på kortet, når der kommer nye.
            </div>
          )}
        </section>

        {partners.length > 0 ? (
          <section className="flex flex-col gap-3" style={rise(section++)}>
            <span className={`${label} px-1 pt-2`} style={muted}>
              Fordele hos vores partnere
            </span>
            {partners.map((p) => (
              <div key={p.id} className="rounded-[22px] p-5" style={panel}>
                <p className={label} style={muted}>
                  {p.partnerName}
                </p>
                <p className="mt-1 text-[1.2rem] font-bold leading-tight tracking-[-0.02em]">{p.title}</p>
                {p.text ? <p className="mt-1 text-[0.95rem] leading-snug" style={muted}>{p.text}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem]">
                  <span className="rounded-full px-2.5 py-1 font-semibold" style={{ background: rgba(fg, 0.12) }}>
                    Vis kortet i Wallet
                  </span>
                  {p.endsAt ? <span style={muted}>Til og med {formatDkDate(new Date(p.endsAt.getTime() - 1))}</span> : null}
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
                      Se mere
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {referral ? (
          <section style={rise(section++)}>
            <ShareReferral
              code={referral.code}
              text={referralShareText(shop, referral.newCustomerReward)}
              url={referral.shareUrl}
              friendGift={referral.newCustomerReward}
              yourReward={referral.referrerReward}
              referralsDone={referral.referralsDone}
              fg={fg}
              bg={bg}
            />
          </section>
        ) : null}

        <footer className="mt-6 text-center text-[0.78rem]" style={{ color: rgba(fg, 0.55) }}>
          <a href="/privatliv" className="underline underline-offset-2">
            Privatliv
          </a>
        </footer>
      </div>
    </main>
  );
}
