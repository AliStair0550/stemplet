"use client";

import { useEffect, useRef, useState } from "react";

// Adresse-autocomplete mod Photon (komoot, OpenStreetMap-data). DAWA lukkede i
// 2026 (svarer 410 Gone), og afloeseren GSearch kraever en token. Photon er
// gratis, uden noegle og har aaben CORS, saa der stadig ikke skal et server-kald
// til. Brugeren vaelger en rigtig adresse fra listen, saa vej, husnummer og
// postnummer er korrekte, i stedet for at gaette paa et frit indtastet felt.
type Suggestion = { tekst: string; id: string };

// Danmark inkl. Bornholm (minLon, minLat, maxLon, maxLat).
const DK_BBOX = "7.9,54.5,15.3,57.8";

type PhotonFeature = {
  properties?: {
    osm_id?: number;
    countrycode?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
  };
};

// "Vej 12, 8000 By". Uden vej (fx et stednavn) bruges navnet i stedet.
function formatAddress(p: NonNullable<PhotonFeature["properties"]>): string | null {
  const road = p.street ?? p.name;
  if (!road) return null;
  const line1 = p.housenumber ? `${road} ${p.housenumber}` : road;
  const line2 = [p.postcode, p.city].filter(Boolean).join(" ");
  return line2 ? `${line1}, ${line2}` : line1;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  disabled,
  className,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  // Kaldes KUN naar brugeren vaelger en rigtig adresse fra listen (til en
  // synlig bekraeftelse), ikke ved fri indtastning.
  onSelect?: (tekst: string) => void;
  // Kaldes naar brugeren trykker Enter UDEN et aktivt forslag (fx "gem").
  onEnter?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  // Naar brugeren lige har valgt et forslag, skal den efterfoelgende value-
  // aendring ikke straks aabne listen igen.
  const justPicked = useRef(false);

  useEffect(() => {
    const q = value.trim();
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    if (q.length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?limit=10&lang=default&bbox=${DK_BBOX}&q=` +
            encodeURIComponent(q),
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { features?: PhotonFeature[] };
        // Kun danske hits, rigtige adresser (med husnummer) foerst, og ingen
        // dubletter (samme adresse kan baade vaere en bygning og en butik).
        const seen = new Set<string>();
        const list: Suggestion[] = (data.features ?? [])
          .map((f) => f.properties)
          .filter((p): p is NonNullable<PhotonFeature["properties"]> => p?.countrycode === "DK")
          .sort((a, b) => Number(!!b.housenumber) - Number(!!a.housenumber))
          .flatMap((p) => {
            const tekst = formatAddress(p);
            if (!tekst || seen.has(tekst)) return [];
            seen.add(tekst);
            return [{ tekst, id: String(p.osm_id ?? tekst) }];
          })
          .slice(0, 6);
        setItems(list);
        setOpen(list.length > 0);
        setActive(-1);
      } catch {
        // Afbrudt kald eller offline: lad brugeren skrive videre i fred.
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(s: Suggestion) {
    justPicked.current = true;
    onChange(s.tekst);
    onSelect?.(s.tekst);
    setItems([]);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && items.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, items.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        // Enter vaelger det fremhaevede forslag (eller det oeverste), saa man
        // altid faar en rigtig adresse i stedet for sin egen halvfaerdige tekst.
        e.preventDefault();
        pick(items[active >= 0 ? active : 0]);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-liste` : undefined}
        className={className}
      />
      {open ? (
        <ul
          id={id ? `${id}-liste` : undefined}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-clay bg-parchment py-1 shadow-lift"
        >
          {items.map((s, i) => (
            <li key={`${s.id}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                // mousedown foer blur: bevar valget selv om input mister fokus.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-4 py-2.5 text-left text-[0.88rem] font-[300] leading-snug transition-colors ${
                  i === active ? "bg-terracotta/10 text-ink" : "text-stone"
                }`}
              >
                {s.tekst}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
