"use client";

import { useState, useTransition } from "react";
import {
  generateApiKeyAction,
  revokeApiKeyAction,
  saveWebhookUrl,
} from "../actions";
import { btnClass } from "@/components/ui";
import { Panel } from "@/components/dash";

// ── Smaa byggeklodser ────────────────────────────────────────────────

function CopyButton({ value, label = "Kopiér" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blokeret - ignorér */
        }
      }}
      className="shrink-0 border border-clay px-3 py-1.5 text-[0.68rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:border-terracotta hover:text-terracotta"
    >
      {done ? "Kopieret ✓" : label}
    </button>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-fog bg-sand/60 px-4 py-3 text-[0.76rem] leading-relaxed text-ink">
      <code>{children}</code>
    </pre>
  );
}

function EndpointRow({
  method,
  path,
  desc,
}: {
  method: string;
  path: string;
  desc: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-fog py-2.5 first:border-t-0">
      <span className="w-14 shrink-0 text-[0.66rem] font-[500] uppercase tracking-[0.08em] text-terracotta">
        {method}
      </span>
      <code className="text-[0.8rem] text-ink">{path}</code>
      <span className="text-[0.78rem] font-[200] text-slate">{desc}</span>
    </div>
  );
}

// ── Hovedkomponent ───────────────────────────────────────────────────

export function IntegrationsClient({
  apiKey,
  webhookUrl,
  baseUrl,
}: {
  apiKey: string | null;
  webhookUrl: string | null;
  baseUrl: string;
}) {
  const [keyPending, startKey] = useTransition();
  const [confirmNew, setConfirmNew] = useState(false);

  const [hookPending, startHook] = useTransition();
  const [hookMsg, setHookMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  function onGenerate() {
    setConfirmNew(false);
    startKey(async () => {
      await generateApiKeyAction();
    });
  }

  function onRevoke() {
    startKey(async () => {
      await revokeApiKeyAction();
    });
  }

  function onSaveHook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHookMsg(null);
    const fd = new FormData(e.currentTarget);
    startHook(async () => {
      const res = await saveWebhookUrl(fd);
      setHookMsg({
        ok: res.ok,
        text: res.ok ? "Gemt" : (res.error ?? "Noget gik galt."),
      });
    });
  }

  const sampleKey = apiKey ?? "stmp_din_nøgle_her";
  const sampleSerial = "ABC123";

  return (
    <div className="flex flex-col gap-6">
      {/* Venlig intro, saa ikke-tekniske brugere ikke bliver bange */}
      <div className="rounded-lg border border-terracotta/30 bg-terracotta/[0.05] p-6">
        <h2 className="text-[1rem] font-[400] text-ink">Skal du bruge det her?</h2>
        <p className="mt-2 max-w-2xl text-[0.88rem] font-[200] leading-relaxed text-stone">
          Kun hvis du vil koble Stemplet sammen med et andet system, fx dit
          kassesystem eller et værktøj som Zapier. Så kan stempler og belønninger
          køre helt af sig selv. Ellers kan du roligt springe siden over, alt
          virker uden.
        </p>
      </div>

      {/* API-nøgle */}
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
              API-nøgle
            </h2>
            <p className="mt-2 max-w-lg text-[0.85rem] font-[200] text-stone">
              Én hemmelig nøgle giver adgang til hele API&apos;et og signerer
              dine webhooks. Del den aldrig offentligt.
            </p>
          </div>
        </div>

        {apiKey ? (
          <>
            <div className="mt-4 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-fog bg-sand/60 px-4 py-2.5 text-[0.82rem] text-ink">
                {apiKey}
              </code>
              <CopyButton value={apiKey} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {confirmNew ? (
                <>
                  <span className="text-[0.8rem] font-[300] text-rust">
                    Sikker? Den gamle nøgle holder op med at virke.
                  </span>
                  <button
                    onClick={onGenerate}
                    disabled={keyPending}
                    className={btnClass("terracotta")}
                  >
                    {keyPending ? "Fornyer..." : "Ja, forny"}
                  </button>
                  <button
                    onClick={() => setConfirmNew(false)}
                    className={btnClass("ghost")}
                  >
                    Fortryd
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmNew(true)}
                    disabled={keyPending}
                    className={btnClass("outline")}
                  >
                    Forny nøgle
                  </button>
                  <button
                    onClick={onRevoke}
                    disabled={keyPending}
                    className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-rust"
                  >
                    {keyPending ? "..." : "Slå adgang fra"}
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <button
              onClick={onGenerate}
              disabled={keyPending}
              className={btnClass("terracotta")}
            >
              {keyPending ? "Danner..." : "Dan API-nøgle"}
            </button>
          </div>
        )}
      </Panel>

      {/* Webhook */}
      <Panel>
        <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Webhook
        </h2>
        <p className="mt-2 max-w-lg text-[0.85rem] font-[200] text-stone">
          Vi sender en besked til din URL, hver gang der sker noget, så dine
          egne systemer opdateres automatisk. Hver besked er signeret med din
          API-nøgle i headeren{" "}
          <code className="text-[0.8rem] text-ink">x-stemplet-signature</code>.
        </p>

        <form onSubmit={onSaveHook} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              name="webhookUrl"
              type="url"
              defaultValue={webhookUrl ?? ""}
              placeholder="https://minbutik.dk/stemplet-webhook"
              className="min-w-0 flex-1 border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.88rem] text-ink outline-none focus:border-terracotta"
            />
            <button
              type="submit"
              disabled={hookPending}
              className={btnClass("primary")}
            >
              {hookPending ? "Gemmer..." : "Gem"}
            </button>
          </div>
          {hookMsg ? (
            <span
              className={`text-[0.8rem] font-[300] ${
                hookMsg.ok ? "text-terracotta" : "text-rust"
              }`}
            >
              {hookMsg.text}
            </span>
          ) : (
            <span className="text-[0.74rem] font-[200] text-slate">
              Lad feltet stå tomt for at slå webhooks fra. Kræver en aktiv
              API-nøgle.
            </span>
          )}
        </form>

        <div className="mt-5">
          <p className="mb-2 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
            Hændelser vi sender
          </p>
          <div className="rounded-lg border border-fog px-4">
            <EndpointRow
              method="event"
              path="stamp.created"
              desc="Et stempel blev givet"
            />
            <EndpointRow
              method="event"
              path="reward.ready"
              desc="Kortet er fuldt, belønning klar"
            />
            <EndpointRow
              method="event"
              path="reward.redeemed"
              desc="Belønningen blev indløst"
            />
          </div>
        </div>
      </Panel>

      {/* API-dokumentation foldet ind, saa ikke-tekniske brugere ikke skraemmes */}
      <details className="group rounded-lg border border-fog bg-white shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
              For udviklere: API&apos;et
            </h2>
            <p className="mt-1 text-[0.82rem] font-[200] text-stone">
              Endpoints, eksempler og svar. Klik for at folde ud.
            </p>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0 text-slate transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="border-t border-fog p-6 pt-5">
        <p className="max-w-lg text-[0.85rem] font-[200] text-stone">
          Alle kald bruger din nøgle som{" "}
          <code className="text-[0.8rem] text-ink">Bearer</code>-token. Basis-URL:
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-fog bg-sand/60 px-4 py-2.5 text-[0.82rem] text-ink">
            {baseUrl}/api/v1
          </code>
          <CopyButton value={`${baseUrl}/api/v1`} />
        </div>

        <div className="mt-5 rounded-lg border border-fog px-4">
          <EndpointRow
            method="POST"
            path="/api/v1/stamp"
            desc="Giv et stempel"
          />
          <EndpointRow
            method="POST"
            path="/api/v1/redeem"
            desc="Indløs en fuld belønning"
          />
          <EndpointRow
            method="GET"
            path="/api/v1/customers/{serial}"
            desc="Slå ét kort op"
          />
          <EndpointRow
            method="GET"
            path="/api/v1/customers"
            desc="Liste over alle kort"
          />
          <EndpointRow
            method="GET"
            path="/api/v1/stats"
            desc="Butikkens nøgletal"
          />
        </div>

        <p className="mt-5 mb-2 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
          Eksempel: giv et stempel
        </p>
        <Code>{`curl -X POST ${baseUrl}/api/v1/stamp \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"serial": "${sampleSerial}"}'`}</Code>

        <p className="mt-4 mb-2 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
          Svar
        </p>
        <Code>{`{
  "ok": true,
  "serial": "${sampleSerial}",
  "stamps": 7,
  "required": 10,
  "rewardReady": false,
  "justCompleted": false,
  "increment": 1
}`}</Code>

        <p className="mt-4 text-[0.78rem] font-[200] text-slate">
          Kundens{" "}
          <code className="text-[0.8rem] text-ink">serial</code> står på kortets
          stregkode og i kundelisten. Serienummeret hører kun til din butik,
          nøgler fra andre butikker kan ikke røre det.
        </p>
        </div>
      </details>
    </div>
  );
}
