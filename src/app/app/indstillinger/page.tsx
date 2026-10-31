import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { listDevices } from "@/lib/kasse";
import { SettingsForms } from "./SettingsForms";
import { WeeklyEmailToggle } from "./WeeklyEmailToggle";
import { WeeklyEmailRecipient } from "./WeeklyEmailRecipient";
import { SelfScanToggle } from "./SelfScanToggle";
import { AccessManager } from "./AccessManager";
import { LocationCard } from "./LocationCard";
import { DeleteProfile } from "./DeleteProfile";
import { soleBusinessesOf } from "@/lib/profile-delete";
import { PRO_PRICE_DKK, trialDaysLeft, trialEndsAt } from "@/lib/plans";
import Link from "next/link";
import { formatDkDate, formatDkDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Indstillinger" };
export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel",
  REDEEM: "Indløsning",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Markeret",
  DELETE_CUSTOMER: "Kunde slettet",
};

export default async function IndstillingerPage() {
  const { business, userId, email } = await requireBusiness();
  const trialLeft = trialDaysLeft(business.createdAt);

  const [logs, devices, memberships, sole] = await Promise.all([
    prisma.auditLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    listDevices(business.id),
    prisma.membership.findMany({
      where: { businessId: business.id },
      select: {
        user: { select: { id: true, email: true, emailVerified: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    soleBusinessesOf(userId),
  ]);
  const members = memberships.map((m) => m.user);
  const loginEmails = members.map((u) => ({
    id: u.id,
    email: u.email,
    isYou: u.id === userId,
    verified: u.emailVerified != null,
  }));
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

      <h2 className="mb-4 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Din butik
      </h2>
      <SettingsForms
        name={business.name}
        cooldown={business.stampCooldownMin}
        category={business.category}
        selfScan={business.selfScanEnabled}
        hasPin={business.staffPin != null}
      />

      <h2
        id="adgang"
        className="mb-4 mt-12 scroll-mt-24 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink"
      >
        Adgang
      </h2>
      {/* Login-mails (fuld adgang) og kasse-enheder (kun stempel) samlet: vaelg
          type naar du tilfoejer adgang. */}
      <div>
        <AccessManager emails={loginEmails} devices={deviceList} />
      </div>

      <h2 className="mb-4 mt-12 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Ved kassen
      </h2>

      {/* Selvbetjening (kunden scanner selv) - standard fra */}
      <div>
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
          <div className="mt-5 border-t border-fog pt-4">
            <WeeklyEmailRecipient
              initial={business.weeklyEmailTo}
              emails={members.map((u) => u.email)}
            />
          </div>
        </Panel>
      </div>

      <h2 className="mb-4 mt-12 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
        Konto
      </h2>
      {/* Abonnement */}
      <div id="abonnement" className="scroll-mt-24">
        <Panel>
          <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Abonnement
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-[300] text-[1rem] text-ink">
                {trialLeft > 0 ? `Gratis til og med ${formatDkDate(trialEndsAt(business.createdAt))}` : "Folka Kort"}
              </p>
              <p className="font-[200] text-[0.82rem] text-stone">
                {trialLeft > 0
                  ? `Derefter ${PRO_PRICE_DKK} kr. om måneden ekskl. moms. Ubegrænset antal kortholdere.`
                  : `${PRO_PRICE_DKK} kr. om måneden ekskl. moms. Ubegrænset antal kortholdere.`}
              </p>
            </div>
            <Link href="/app/aftale" className="text-[0.85rem] font-[500] text-ink underline underline-offset-4">
              Se abonnement
            </Link>
          </div>
        </Panel>
      </div>

      {/* Audit log */}
      <div className="mt-6">
        <Panel>
          <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Seneste handlinger
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

      {/* Slet profil: nederst, adskilt fra resten. */}
      <div className="mt-12 border-t border-fog pt-8">
        <DeleteProfile email={email} deletes={sole.map((b) => b.name)} />
      </div>
    </>
  );
}
