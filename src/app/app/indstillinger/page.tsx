import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { listDevices } from "@/lib/kasse";
import { SettingsForms } from "./SettingsForms";
import { WeeklyEmailToggle } from "./WeeklyEmailToggle";
import { WelcomeStampToggle } from "./WelcomeStampToggle";
import { SelfScanToggle } from "./SelfScanToggle";
import { KasseDevices } from "./KasseDevices";
import { LocationCard } from "./LocationCard";
import { SubmitButton } from "@/components/SubmitButton";
import { startCheckout, openPortal } from "../actions";
import { PRO_PRICE_DKK, FREE_CUSTOMER_LIMIT } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { formatDkDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Indstillinger" };
export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel",
  REDEEM: "Indløsning",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Markeret",
};

export default async function IndstillingerPage({
  searchParams,
}: {
  searchParams: Promise<{ betaling?: string; fejl?: string }>;
}) {
  const { business } = await requireBusiness();
  const { betaling, fejl } = await searchParams;
  const stripeOn = stripeConfigured();

  const [logs, devices] = await Promise.all([
    prisma.auditLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    listDevices(business.id),
  ]);
  const deviceList = devices.map((d) => ({
    id: d.id,
    name: d.name,
    lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeading
        title="Indstillinger"
        subtitle="Butik, PIN, kasse-enheder, kort-oplevelse og abonnement."
      />

      {betaling === "ok" ? (
        <div className="mb-6 rounded-lg border border-terracotta bg-terracotta/5 px-5 py-3 text-[0.85rem] font-[200] text-terracotta">
          Tak. Din betaling er registreret.
        </div>
      ) : null}
      {fejl === "stripe" ? (
        <div className="mb-6 rounded-lg border border-clay bg-sand px-5 py-3 text-[0.85rem] font-[200] text-stone">
          Betaling er ikke sat op endnu. Alt andet virker på Gratis-planen.
        </div>
      ) : null}

      <h2 className="mb-4 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Din butik
      </h2>
      <SettingsForms
        name={business.name}
        cooldown={business.stampCooldownMin}
        category={business.category}
        selfScan={business.selfScanEnabled}
      />

      <h2 className="mb-4 mt-12 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Ved kassen
      </h2>
      {/* Kasse-enheder: giv personalet adgang uden dit login */}
      <div>
        <KasseDevices devices={deviceList} />
      </div>

      {/* Selvbetjening (kunden scanner selv) - standard fra */}
      <div className="mt-6">
        <Panel>
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
                Selvbetjening
              </h2>
              <p className="mt-2 max-w-md font-[200] text-[0.85rem] leading-relaxed text-stone">
                Som standard scanner kun personalet kundens kort ved kassen. Slår
                du selvbetjening til, kan kunden også scanne en QR-kode på skærmen
                og stemple sig selv (kassemodus).
              </p>
            </div>
            <SelfScanToggle initial={business.selfScanEnabled} />
          </div>
        </Panel>
      </div>

      {/* Velkomststempel ved foerste scan */}
      <div className="mt-6">
        <Panel>
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
                Velkomststempel
              </h2>
              <p className="mt-2 max-w-md font-[200] text-[0.85rem] leading-relaxed text-stone">
                Stemplingen sker altid på samme måde: 1. kunden henter kortet ved
                første scan, 2. I giver stempler ved kassen. Slår du
                velkomststempel til, får kunden også ét stempel med det samme ved
                allerførste scan. Standard er fra, så flowet er ens hver gang.
              </p>
            </div>
            <WelcomeStampToggle initial={business.welcomeStampEnabled} />
          </div>
        </Panel>
      </div>

      <h2 className="mb-4 mt-12 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Kunder og marketing
      </h2>
      {/* Placering til laaseskaerm: kortet dukker op naar kunden er i naerheden */}
      <div>
        <Panel>
          <LocationCard
            initialAddress={business.address}
            initialLat={business.latitude}
            initialLng={business.longitude}
          />
        </Panel>
      </div>

      {/* Ugentligt overblik */}
      <div className="mt-6">
        <Panel>
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
                Ugentligt overblik
              </h2>
              <p className="mt-2 max-w-md font-[200] text-[0.85rem] leading-relaxed text-stone">
                En kort mail hver mandag med ugens stempler, nye kunder og
                indløsninger.
              </p>
            </div>
            <WeeklyEmailToggle initial={business.weeklyEmailEnabled} />
          </div>
        </Panel>
      </div>

      <h2 className="mb-4 mt-12 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Konto
      </h2>
      {/* Abonnement */}
      <div>
        <Panel>
          <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Abonnement
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-[300] text-[1rem] text-ink">
                {business.plan === "PRO" ? "Pro" : "Gratis"}
              </p>
              <p className="font-[200] text-[0.82rem] text-stone">
                {business.plan === "PRO"
                  ? `${PRO_PRICE_DKK} kr./md. Ubegrænset antal kunder.`
                  : `Alle funktioner, op til ${FREE_CUSTOMER_LIMIT} kunder. Opgrader for ubegrænset antal.`}
              </p>
            </div>
            {business.plan === "PRO" ? (
              <form action={openPortal}>
                <SubmitButton variant="outline" pendingText="Åbner...">
                  Administrer abonnement
                </SubmitButton>
              </form>
            ) : stripeOn ? (
              <form action={startCheckout}>
                <SubmitButton variant="terracotta" pendingText="Åbner Stripe...">
                  Opgrader til Pro
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* Audit log */}
      <div className="mt-6">
        <Panel>
          <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Audit log
          </h2>
          {logs.length === 0 ? (
            <p className="font-[200] text-[0.85rem] text-slate">
              Ingen hændelser endnu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.82rem]">
                <thead>
                  <tr className="text-[0.62rem] font-[400] uppercase tracking-[0.12em] text-slate">
                    <th className="pb-2 pr-4 font-[400]">Handling</th>
                    <th className="pb-2 pr-4 font-[400]">Kort</th>
                    <th className="pb-2 pr-4 font-[400]">IP</th>
                    <th className="pb-2 font-[400]">Tid</th>
                  </tr>
                </thead>
                <tbody className="font-[200] text-stone">
                  {logs.map((l) => {
                    const detail = (l.detail ?? {}) as unknown as {
                      serial?: string;
                    };
                    return (
                      <tr key={l.id} className="border-t border-fog">
                        <td
                          className={`py-2 pr-4 ${
                            l.action === "FLAGGED" || l.action === "PIN_FAIL"
                              ? "text-rust"
                              : "text-ink"
                          }`}
                        >
                          {ACTION_LABEL[l.action] ?? l.action}
                        </td>
                        <td className="py-2 pr-4 tracking-[0.1em]">
                          {detail.serial ?? "-"}
                        </td>
                        <td className="py-2 pr-4">{l.ip ?? "-"}</td>
                        <td className="py-2 whitespace-nowrap">
                          {formatDkDateTime(l.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
