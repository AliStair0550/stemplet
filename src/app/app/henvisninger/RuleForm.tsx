"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { rewardPhrase } from "@/lib/referral-text";
import { saveReferralSettings, type RuleInput } from "./actions";

// Opsaetningen af henvisninger i saerskilte kasser: hver kasse eet spoergsmaal,
// een forklarende linje og de felter, der skal udfyldes. Et eksempel viser, hvad
// kunden ser. Genbruges af onboardingen i fase 5.

type RewardType = "AMOUNT" | "STAMPS" | "SERVICE";

type Form = {
  newCustomerRewardType: RewardType;
  newCustomerRewardValue: string;
  referrerRewardType: RewardType;
  referrerRewardValue: string;
  minPurchaseKr: string;
  maxReferralsPerMonth: string;
  rewardExpiryDays: string;
  termsLine: string;
  bookingUrl: string;
};

const TYPES: { value: RewardType; label: string }[] = [
  { value: "AMOUNT", label: "Rabat i kr." },
  { value: "STAMPS", label: "Stempler" },
  { value: "SERVICE", label: "Gratis behandling" },
];

const fieldCls =
  "min-h-11 w-full rounded-md border border-clay bg-white px-3 text-[0.95rem] text-ink outline-none focus:border-terracotta";

function Box({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
      <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
      <p className="mt-1 text-[0.85rem] leading-relaxed text-stone">{hint}</p>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  suffix,
  children,
}: {
  label: string;
  hint?: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.82rem] text-ink">{label}</span>
      <span className="flex items-center gap-2">
        {children}
        {suffix ? <span className="shrink-0 text-[0.88rem] text-stone">{suffix}</span> : null}
      </span>
      {hint ? <span className="text-[0.76rem] text-slate">{hint}</span> : null}
    </label>
  );
}

function RewardPicker({
  type,
  value,
  onType,
  onValue,
}: {
  type: RewardType;
  value: string;
  onType: (t: RewardType) => void;
  onValue: (v: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => onType(t.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-[0.88rem] transition-colors",
              type === t.value
                ? "border-terracotta bg-terracotta/10 text-terracotta"
                : "border-clay text-stone hover:border-terracotta",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {type === "SERVICE" ? (
        <Field label="Hvilken behandling?">
          <input
            value={value}
            onChange={(e) => onValue(e.target.value)}
            placeholder="Gratis klip"
            maxLength={80}
            className={fieldCls}
          />
        </Field>
      ) : (
        <Field label={type === "AMOUNT" ? "Beløb" : "Antal stempler"} suffix={type === "AMOUNT" ? "kr." : "stempler"}>
          <input
            value={value}
            onChange={(e) => onValue(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder={type === "AMOUNT" ? "100" : "3"}
            className={cn(fieldCls, "max-w-[10rem]")}
          />
        </Field>
      )}
    </>
  );
}

export function RuleForm({
  initial,
  pageUrl,
  isNew,
}: {
  initial: Form;
  pageUrl: string;
  isNew: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setNote(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const phrase = (t: RewardType, v: string) =>
    v.trim() ? rewardPhrase(t, v) : t === "SERVICE" ? "en behandling" : "...";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setNote(null);
        start(async () => {
          const res = await saveReferralSettings(form as RuleInput);
          if (res.ok) {
            setNote({ ok: true, text: "Gemt. Kundesiden er opdateret." });
            if (isNew) router.push("/app/henvisninger");
          } else {
            setNote({ ok: false, text: res.error });
          }
        });
      }}
    >
      <Box title="Den nye kunde får" hint="Det, vennen får ved sit første besøg.">
        <RewardPicker
          type={form.newCustomerRewardType}
          value={form.newCustomerRewardValue}
          onType={(t) => set("newCustomerRewardType", t)}
          onValue={(v) => set("newCustomerRewardValue", v)}
        />
      </Box>

      <Box title="Ambassadøren får" hint="Det, din kunde får, når vennen har været der.">
        <RewardPicker
          type={form.referrerRewardType}
          value={form.referrerRewardValue}
          onType={(t) => set("referrerRewardType", t)}
          onValue={(v) => set("referrerRewardValue", v)}
        />
      </Box>

      <Box title="Betingelser" hint="Vises under knappen på kundesiden. Personalet tjekker dem ved kassen.">
        <Field label="Minimumskøb ved første besøg" suffix="kr." hint="Lad stå tomt, hvis der ikke er et minimum.">
          <input
            value={form.minPurchaseKr}
            onChange={(e) => set("minPurchaseKr", e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="300"
            className={cn(fieldCls, "max-w-[10rem]")}
          />
        </Field>
        <Field label="Betingelser i én linje">
          <input
            value={form.termsLine}
            onChange={(e) => set("termsLine", e.target.value)}
            maxLength={120}
            placeholder="Gælder ved første besøg over 300 kr."
            className={fieldCls}
          />
        </Field>
      </Box>

      <Box title="Grænser" hint="Beskytter dig mod misbrug. Standarden passer til de fleste.">
        <Field
          label="Højst antal belønninger pr. ambassadør pr. måned"
          hint="Når grænsen er nået, får den nye kunde stadig sin rabat. Tomt betyder ingen grænse."
        >
          <input
            value={form.maxReferralsPerMonth}
            onChange={(e) => set("maxReferralsPerMonth", e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="5"
            className={cn(fieldCls, "max-w-[10rem]")}
          />
        </Field>
        <Field label="Belønninger gælder i" suffix="dage">
          <input
            value={form.rewardExpiryDays}
            onChange={(e) => set("rewardExpiryDays", e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="180"
            className={cn(fieldCls, "max-w-[10rem]")}
          />
        </Field>
      </Box>

      <Box title="Booking" hint="Vises som en knap 'Book tid' for den nye kunde. Valgfrit.">
        <Field label="Link til din booking (fx Planway)">
          <input
            value={form.bookingUrl}
            onChange={(e) => set("bookingUrl", e.target.value)}
            inputMode="url"
            placeholder="https://"
            className={fieldCls}
          />
        </Field>
      </Box>

      <section className="rounded-lg border border-fog bg-sand/40 p-5 md:p-6">
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Sådan ser kunderne det</h2>
        <p className="mt-3 text-[1.1rem] text-ink">
          Henvis en ven og få {phrase(form.referrerRewardType, form.referrerRewardValue)}
        </p>
        <p className="mt-1 text-[0.9rem] text-stone">
          Din ven får {phrase(form.newCustomerRewardType, form.newCustomerRewardValue)} ved første besøg.
        </p>
        {form.termsLine.trim() ? (
          <p className="mt-1 text-[0.82rem] text-slate">{form.termsLine}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-fog pt-4 text-[0.82rem]">
          <a href={pageUrl} target="_blank" rel="noreferrer" className="break-all text-terracotta underline underline-offset-2">
            {pageUrl}
          </a>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pageUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                // Kopiering afvist: linket kan stadig markeres.
              }
            }}
            className="rounded-full border border-clay px-3 py-1 text-stone hover:text-ink"
          >
            {copied ? "Kopieret" : "Kopiér link"}
          </button>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-1 flex items-center gap-4 bg-parchment/95 px-1 py-4 backdrop-blur">
        <button type="submit" disabled={pending} className={btnClass("primary", "lg")}>
          {pending ? "Gemmer" : "Gem"}
        </button>
        {note ? (
          <p role="status" className={cn("text-[0.88rem]", note.ok ? "text-ink" : "text-rust")}>
            {note.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
