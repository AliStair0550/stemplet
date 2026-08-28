"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CardDesigner,
  DEFAULT_DESIGN,
  type CardDesign,
} from "@/components/CardDesigner";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { btnClass } from "@/components/ui";
import { BUSINESS_CATEGORIES } from "@/lib/categories";
import { createBusinessForCurrentUser } from "../actions";

const termLink =
  "text-terracotta underline underline-offset-2 hover:opacity-70";

export function NewBusinessForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [addrConfirmed, setAddrConfirmed] = useState(false);
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Skriv butikkens navn (mindst 2 tegn).");
      return;
    }
    if (!acceptedTerms) {
      setError("Sæt flueben ved betingelserne nederst.");
      return;
    }
    start(async () => {
      const res = await createBusinessForCurrentUser({
        name,
        category,
        address,
        design,
        acceptedTerms,
      });
      if (res.ok) {
        router.push("/app/kom-i-gang");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-9">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
          Butikkens navn
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
          placeholder="Fx Little Brother Coffee"
          className="max-w-md border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-terracotta"
        />
      </label>

      <div className="border-t border-fog pt-7">
        <h2 className="mb-4 text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
          Design kortet
        </h2>
        <CardDesigner
          value={design}
          onChange={setDesign}
          businessName={name || "Din butik"}
          allowLogo
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-fog pt-7">
        <h2 className="text-[0.8rem] font-[500] uppercase tracking-[0.16em] text-ink">
          Opsætning
        </h2>

        <label className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Branche (valgfri)
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
          >
            <option value="">Vælg branche</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Placering til låseskærm (valgfri)
          </span>
          <AddressAutocomplete
            value={address}
            onChange={(v) => {
              setAddress(v);
              setAddrConfirmed(false);
            }}
            onSelect={() => setAddrConfirmed(true)}
            placeholder="Begynd at skrive, og vælg adressen"
            className="w-full border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
          />
          {addrConfirmed ? (
            <p className="mt-1 text-[0.78rem] font-[400] text-terracotta">
              Adresse fundet og bekræftet
            </p>
          ) : (
            <p className="mt-1 text-[0.74rem] font-[300] text-slate">
              Vælg adressen fra listen, så er postnummeret altid rigtigt.
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta"
          />
          <span className="text-[0.78rem] font-[300] leading-relaxed text-stone">
            Jeg accepterer{" "}
            <a href="/handelsbetingelser" target="_blank" rel="noreferrer" className={termLink}>
              handelsbetingelserne
            </a>
            ,{" "}
            <a href="/privatliv" target="_blank" rel="noreferrer" className={termLink}>
              privatlivspolitikken
            </a>{" "}
            og{" "}
            <a href="/databehandleraftale" target="_blank" rel="noreferrer" className={termLink}>
              databehandleraftalen
            </a>
            .
          </span>
        </label>
      </div>

      {error ? (
        <p className="text-[0.85rem] font-[300] leading-relaxed text-rust">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-5 border-t border-fog pt-6">
        <button
          type="submit"
          disabled={pending}
          className={`${btnClass("primary", "lg")} disabled:opacity-60`}
        >
          {pending ? "Opretter..." : "Opret butik"}
        </button>
        <Link
          href="/app"
          className="text-[0.8rem] font-[300] text-slate transition-colors hover:text-ink"
        >
          Annullér
        </Link>
      </div>
    </form>
  );
}
