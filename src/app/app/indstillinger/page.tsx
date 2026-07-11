import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { SettingsForms } from "./SettingsForms";
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

  const logs = await prisma.auditLog.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <>
      <PageHeading title="Indstillinger" subtitle="Profil, PIN, abonnement og log." />

      {betaling === "ok" ? (
        <div className="mb-6 rounded-sm border border-moss bg-moss/5 px-5 py-3 text-[0.85rem] font-[200] text-moss">
          Tak. Din betaling er registreret.
        </div>
      ) : null}
      {fejl === "stripe" ? (
        <div className="mb-6 rounded-sm border border-clay bg-sand px-5 py-3 text-[0.85rem] font-[200] text-stone">
          Betaling er ikke sat op endnu. Alt andet virker på Gratis-planen.
        </div>
      ) : null}

      <SettingsForms
        name={business.name}
        cooldown={business.stampCooldownMin}
      />

      {/* Abonnement */}
      <div className="mt-6">
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
                  : `Alle funktioner, op til ${FREE_CUSTOMER_LIMIT} aktive kunder. Opgrader for ubegrænset.`}
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
                <SubmitButton variant="moss" pendingText="Åbner Stripe...">
                  Opgrader til Pro
                </SubmitButton>
              </form>
            ) : (
              <span className="text-[0.78rem] font-[200] text-slate">
                Betaling sættes op snart
              </span>
            )}
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
                              ? "text-moss"
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
