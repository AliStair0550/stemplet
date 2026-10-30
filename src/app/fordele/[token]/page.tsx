import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cardTitle, isStampIcon, rgba, shade, type StampIconKey } from "@/lib/brand";
import { verifyMemberToken } from "@/lib/member-link";
import { loadReferralPassInfo } from "@/lib/referral-wallet";
import { owedLabel } from "@/lib/wallet/referral-fields";
import { referralShareText, firstName } from "@/lib/referral-text";
import { newsOptOutUrl } from "@/lib/news-optout";
import { formatDkDate } from "@/lib/utils";
import { StampIcon } from "@/components/StampIcon";
import { ShareReferral } from "./ShareReferral";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Tilbud og fordele" }, robots: { index: false } };

// "Tilbud og fordele": kortholderens egen side, aabnet fra knapperne under
// kortet i Wallet. Viser status paa stempelkortet, det kunden har til gode,
// tilbud lige nu (kampagner og butikkens seneste besked) og henvisningen.

type Offer = { title: string; text: string; until?: Date };

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
  const referral = await loadReferralPassInfo(cc, now).catch(() => null);

  const shop = cardTitle(b);
  const fg = b.textColor;
  const bg = b.primaryColor;
  const icon: StampIconKey = isStampIcon(cc.card.stampIcon) ? cc.card.stampIcon : "coffee";
  const required = cc.card.stampsRequired;
  const stamps = Math.min(cc.stamps, required);
  const full = stamps >= required;
  const name = firstName(cc.name);

  const offers: Offer[] = [];
  for (const c of cc.card.campaigns) {
    if (c.type === "DOUBLE_STAMP") offers.push({ title: "Dobbelt stempel", text: "Hvert stempel tæller dobbelt.", until: c.endsAt });
    if (c.type === "WELCOME_BONUS" && cc.lifetimeStamps === 0)
      offers.push({ title: "Velkomstbonus", text: "Dit første stempel tæller ekstra.", until: c.endsAt });
  }
  if (b.newsText && !cc.newsOptOut) offers.push({ title: `Nyt fra ${shop}`, text: b.newsText });

  const panel = { background: rgba(fg, 0.08), border: `1px solid ${rgba(fg, 0.14)}` };
  const muted = { color: rgba(fg, 0.72) };
  const label = "text-[0.72rem] font-semibold uppercase tracking-[0.12em]";

  return (
    <main
      className="min-h-screen px-5 pb-16 pt-10"
      style={{
        background: `radial-gradient(ellipse 120% 50% at 50% 0%, ${rgba(fg, 0.14)} 0%, transparent 65%), linear-gradient(180deg, ${bg} 0%, ${shade(bg, -0.18)} 100%)`,
        color: fg,
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="flex flex-col items-center gap-3 text-center">
          {b.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt={shop} className="h-12 w-auto max-w-[60%] object-contain" />
          ) : (
            <span className="text-[1.1rem] font-bold tracking-[-0.02em]">{shop}</span>
          )}
          <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.035em]">
            {name ? `Hej ${name}` : "Dine fordele"}
          </h1>
          <p className="text-[0.95rem]" style={muted}>
            Tilbud og fordele til dig som kortholder hos {shop}.
          </p>
        </header>

        {b.stampsEnabled ? (
          <section className="rounded-[24px] p-5" style={panel}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={label} style={muted}>
                Dit stempelkort
              </span>
              <span className="text-[1.6rem] font-bold tabular-nums tracking-[-0.03em]">
                {stamps}/{required}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2.5">
              {Array.from({ length: required }, (_, i) => (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-full"
                  style={i < stamps ? { background: fg, color: bg } : { border: `1.5px solid ${rgba(fg, 0.3)}`, color: rgba(fg, 0.35) }}
                >
                  <StampIcon icon={i === required - 1 ? "gift" : icon} className="h-[52%] w-[52%]" />
                </span>
              ))}
            </div>
            <p className="mt-4 text-[1rem] font-medium leading-snug">
              {full
                ? `Din belønning er klar: ${cc.card.rewardText}. Vis kortet ved kassen.`
                : `${required - stamps} ${required - stamps === 1 ? "stempel" : "stempler"} til ${cc.card.rewardText.charAt(0).toLowerCase()}${cc.card.rewardText.slice(1)}.`}
            </p>
            {cc.lifetimeStamps > stamps ? (
              <p className="mt-1 text-[0.85rem]" style={muted}>
                {cc.lifetimeStamps} stempler i alt hos {shop}.
              </p>
            ) : null}
          </section>
        ) : null}

        {referral && referral.rewards.length > 0 ? (
          <section className="rounded-[24px] p-5" style={panel}>
            <span className={label} style={muted}>
              Til gode
            </span>
            <p className="mt-2 text-[1.3rem] font-bold tracking-[-0.02em]">
              {owedLabel(referral.rewards)}
            </p>
            <p className="mt-1 text-[0.9rem]" style={muted}>
              Fra dine henvisninger. Vis kortet ved kassen, så indløser personalet det.
            </p>
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <span className={`${label} px-1`} style={muted}>
            Tilbud lige nu
          </span>
          {offers.length > 0 ? (
            offers.map((o) => (
              <div key={o.title + o.text} className="rounded-[20px] p-5" style={{ background: fg, color: bg }}>
                <p className="text-[1.15rem] font-bold tracking-[-0.02em]">{o.title}</p>
                <p className="mt-1 text-[0.95rem] leading-snug">{o.text}</p>
                {o.until ? (
                  <p className="mt-2 text-[0.8rem] font-medium" style={{ color: rgba(bg, 0.7) }}>
                    Gælder til og med {formatDkDate(new Date(o.until.getTime() - 1))}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[20px] p-5 text-[0.95rem] leading-snug" style={panel}>
              Ingen særlige tilbud lige nu. Du får besked på kortet, når der kommer nye.
            </div>
          )}
        </section>

        {referral ? (
          <section className="flex flex-col items-center gap-3 rounded-[24px] p-5 text-center" style={panel}>
            <span className={label} style={muted}>
              Henvis en ven
            </span>
            <p className="text-[1.05rem] leading-snug">
              Din ven får {referral.newCustomerReward} ved første besøg. Du får {referral.referrerReward}, når vennen har været her.
            </p>
            <p className="w-full rounded-2xl py-3 text-[1.7rem] font-bold tracking-[0.08em]" style={{ background: rgba(fg, 0.1) }}>
              {referral.code}
            </p>
            <ShareReferral text={referralShareText(shop, referral.newCustomerReward)} url={referral.shareUrl} fg={fg} bg={bg} />
            {referral.referralsDone > 0 ? (
              <p className="text-[0.85rem]" style={muted}>
                Du har henvist {referral.referralsDone} {referral.referralsDone === 1 ? "ven" : "venner"}. Tak.
              </p>
            ) : null}
          </section>
        ) : null}

        <footer className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.8rem]" style={muted}>
          <a href={`/k/${b.slug}`} className="underline underline-offset-2">
            Butikkens side
          </a>
          <a href={newsOptOutUrl(cc.serial)} className="underline underline-offset-2">
            Pushbeskeder
          </a>
          <a href="/privatliv" className="underline underline-offset-2">
            Privatliv
          </a>
        </footer>
      </div>
    </main>
  );
}
