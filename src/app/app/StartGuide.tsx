import Link from "next/link";
import { WalletIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ackPosterAction, answerWelcomeStampAction, dismissOnboardingAction } from "./actions";
import { GuideDone } from "./GuideDone";
import { ShareCardButton } from "./ShareCardButton";
import { SeeCardLink } from "./SeeCardLink";

// Kom i gang paa Hjem for en ny butik: korte trin fra oprettet til den foerste
// kunde. Det, der allerede er klaret ved oprettelsen (fx henvisning), staar
// krydset af. Det naeste trin er fremhaevet; resten kan tages i vilkaarlig
// raekkefoelge. Valget om foerste stempel besvares direkte her, og plakaten
// klikkes bare af (den ligger i Menu). Naar alt er klaret, fejres det.

export type GuideStep = {
  kind: "design" | "welcome" | "referral" | "offer" | "share" | "poster";
  title: string;
  text: string;
  done: boolean;
  href?: string;
  cta?: string;
};

const pill = "inline-flex min-h-10 items-center rounded-full px-4 text-[0.85rem] font-semibold transition-colors";
const light = `${pill} bg-white text-[#061C3D] hover:bg-[#E8F0FB]`;
const ghost = `${pill} text-white ring-1 ring-inset ring-white/30 hover:bg-white/10`;

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const COUNT_WORD: Record<number, string> = { 3: "Tre", 4: "Fire", 5: "Fem", 6: "Seks" };

export function StartGuide({
  businessId,
  steps,
  share,
}: {
  businessId: string;
  steps: GuideStep[];
  share: { businessName: string; url: string; text: string; shared: boolean; seen: boolean; walletEnabled: boolean };
}) {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  if (current === -1) return <GuideDone businessId={businessId} share={share} />;

  return (
    <section aria-labelledby="kom-i-gang" className="mb-10 rounded-[22px] bg-[#061C3D] p-5 text-white md:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 id="kom-i-gang" className="text-[1.25rem] font-semibold tracking-[-0.02em]">
          Kom godt i gang
        </h2>
        <span className="flex items-center gap-2">
          <span className="text-[0.9rem] font-semibold tabular-nums text-[#7CC4FF]">
            {doneCount}/{total}
          </span>
          <form action={dismissOnboardingAction}>
            <button
              type="submit"
              aria-label="Luk"
              className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </form>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full bg-[#7CC4FF] transition-[width] duration-700"
          style={{ width: `${Math.max(4, (doneCount / total) * 100)}%` }}
        />
      </div>
      <p className="mt-3 text-[0.9rem] text-white/70">
        {COUNT_WORD[total] ?? "Et par"} korte trin, så er dit kort klar til kunderne.
      </p>

      <ol className="mt-5 flex flex-col gap-2">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={s.kind}
              className={cn(
                "rounded-[16px] p-4 ring-1 ring-inset transition-colors",
                isCurrent ? "bg-white/[.09] ring-white/15" : s.done ? "bg-white/[.02] ring-white/5" : "bg-white/[.05] ring-white/10",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.78rem] font-semibold tabular-nums",
                    s.done ? "bg-[#7CC4FF] text-[#061C3D]" : isCurrent ? "bg-white text-[#061C3D]" : "ring-1 ring-inset ring-white/30 text-white/70",
                  )}
                  aria-label={s.done ? "Klaret" : undefined}
                >
                  {s.done ? <Check /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[1rem] font-semibold", s.done && "text-white/75")}>{s.title}</p>
                  <p className={cn("mt-0.5 text-[0.86rem] leading-snug", s.done ? "text-white/50" : "text-white/70")}>{s.text}</p>

                  {/* Handlingen: altid synlig paa det naeste trin, ellers kun naar trinnet ikke er klaret. */}
                  {s.kind === "welcome" ? (
                    s.done ? (
                      <Link href="/app/regler?f=stempler" className="mt-2 inline-block text-[0.82rem] font-semibold text-[#7CC4FF] underline-offset-4 hover:underline">
                        Skift under Regler
                      </Link>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={answerWelcomeStampAction}>
                          <input type="hidden" name="on" value="1" />
                          <button type="submit" className={light}>
                            Ja, giv 1 stempel
                          </button>
                        </form>
                        <form action={answerWelcomeStampAction}>
                          <input type="hidden" name="on" value="0" />
                          <button type="submit" className={ghost}>
                            Nej tak
                          </button>
                        </form>
                      </div>
                    )
                  ) : s.kind === "poster" ? (
                    s.done ? null : (
                      <form action={ackPosterAction} className="mt-3">
                        <button type="submit" className={isCurrent ? light : ghost}>
                          OK, set
                        </button>
                      </form>
                    )
                  ) : s.kind === "share" ? (
                    s.done && !isCurrent ? null : (
                      <div className="mt-3 flex flex-col gap-2">
                        {share.walletEnabled ? (
                          <a
                            href="/api/wallet/butikkort"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-black px-4 text-[0.88rem] font-semibold text-white ring-1 ring-inset ring-white/25 sm:w-fit"
                          >
                            <WalletIcon />
                            Føj til Apple Wallet
                          </a>
                        ) : null}
                        <span className="flex flex-wrap gap-2">
                          <ShareCardButton businessName={share.businessName} url={share.url} text={share.text} shared={share.shared} tone="light" />
                          <Link href="/app/regler?f=kundekort&vis=1" className={ghost}>
                            Vis QR-kode
                          </Link>
                          <SeeCardLink href={share.url} seen={share.seen} className={ghost}>
                            Se kortet
                          </SeeCardLink>
                        </span>
                      </div>
                    )
                  ) : !s.done && s.href && s.cta ? (
                    <Link href={s.href} className={cn("mt-3", isCurrent ? light : ghost)}>
                      {s.cta}
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
