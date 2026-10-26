"use client";

import { useState, useTransition } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { saveReferralSettings, type RuleInput } from "./actions";

// Butikkens egne regler (fase 3; genbruges af onboardingen i fase 5).

type Form = {
  newCustomerRewardType: "AMOUNT" | "STAMPS" | "SERVICE";
  newCustomerRewardValue: string;
  referrerRewardType: "AMOUNT" | "STAMPS" | "SERVICE";
  referrerRewardValue: string;
  minPurchaseKr: string;
  maxReferralsPerMonth: string;
  rewardExpiryDays: string;
  termsLine: string;
  bookingUrl: string;
};

const TYPES = [
  { value: "AMOUNT", label: "Beløb i kr." },
  { value: "STAMPS", label: "Stempler" },
  { value: "SERVICE", label: "Behandling" },
] as const;

const field =
  "min-h-11 rounded-md border border-clay bg-white px-3 text-[0.92rem] text-ink outline-none focus:border-terracotta";
const input = `${field} w-full`;
const labelCls = "text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate";

export function RuleForm({ initial }: { initial: Form }) {
  const [form, setForm] = useState<Form>(initial);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const reward = (who: "newCustomer" | "referrer", title: string) => {
    const typeKey = `${who}RewardType` as const;
    const valueKey = `${who}RewardValue` as const;
    return (
      <div className="flex flex-col gap-2">
        <span className={labelCls}>{title}</span>
        <div className="flex gap-2">
          <select
            value={form[typeKey]}
            onChange={(e) => set(typeKey, e.target.value as Form[typeof typeKey])}
            className={cn(field, "w-36 shrink-0")}
            aria-label={`${title}: type`}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={form[valueKey]}
            onChange={(e) => set(valueKey, e.target.value)}
            inputMode={form[typeKey] === "SERVICE" ? "text" : "numeric"}
            placeholder={form[typeKey] === "SERVICE" ? "Gratis klip" : "100"}
            className={cn(field, "min-w-0 flex-1")}
            aria-label={`${title}: værdi`}
          />
        </div>
      </div>
    );
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setNote(null);
        start(async () => {
          const res = await saveReferralSettings(form as RuleInput);
          setNote(res.ok ? { ok: true, text: "Gemt." } : { ok: false, text: res.error });
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {reward("newCustomer", "Belønning til ny kunde")}
        {reward("referrer", "Belønning til ambassadør")}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Minimumskøb (kr.)</span>
          <input value={form.minPurchaseKr} onChange={(e) => set("minPurchaseKr", e.target.value)} inputMode="numeric" placeholder="Intet" className={input} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Max pr. ambassadør pr. måned</span>
          <input value={form.maxReferralsPerMonth} onChange={(e) => set("maxReferralsPerMonth", e.target.value)} inputMode="numeric" placeholder="Intet loft" className={input} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelCls}>Belønning gælder (dage)</span>
          <input value={form.rewardExpiryDays} onChange={(e) => set("rewardExpiryDays", e.target.value)} inputMode="numeric" className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className={labelCls}>Betingelser i én linje</span>
        <input value={form.termsLine} onChange={(e) => set("termsLine", e.target.value)} maxLength={120} placeholder="Gælder ved første besøg over 300 kr." className={input} />
      </label>
      <label className="flex flex-col gap-2">
        <span className={labelCls}>Booking-link (valgfrit)</span>
        <input value={form.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} inputMode="url" placeholder="https://" className={input} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={btnClass("primary")}>
          {pending ? "Gemmer" : "Gem"}
        </button>
        {note ? (
          <p role="status" className={cn("text-[0.85rem]", note.ok ? "text-ink" : "text-rust")}>
            {note.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
