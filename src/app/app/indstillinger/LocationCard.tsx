"use client";

import { useState, useTransition } from "react";
import { btnClass } from "@/components/ui";
import { setBusinessLocation, setLocationFromAddress } from "../actions";

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function LocationCard({
  initialAddress,
  initialLat,
  initialLng,
}: {
  initialAddress: string | null;
  initialLat: number | null;
  initialLng: number | null;
}) {
  const hasInitial = initialLat != null && initialLng != null;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    hasInitial ? { lat: initialLat as number, lng: initialLng as number } : null,
  );
  const [savedAddress, setSavedAddress] = useState<string | null>(
    initialAddress,
  );
  const [address, setAddress] = useState(initialAddress ?? "");
  const [pending, start] = useTransition();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveAddress() {
    setError(null);
    const q = address.trim();
    if (q.length < 4) {
      setError("Skriv butikkens adresse, fx gade, nummer og by.");
      return;
    }
    start(async () => {
      const res = await setLocationFromAddress(q);
      if (res.ok) {
        setCoords({ lat: res.lat, lng: res.lng });
        setSavedAddress(q);
      } else {
        setError(res.error);
      }
    });
  }

  function useMyLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Din browser understøtter ikke placering. Skriv adressen i stedet.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        start(async () => {
          const res = await setBusinessLocation(lat, lng);
          if (res.ok) {
            setCoords({ lat, lng });
            setSavedAddress(null);
            setAddress("");
          } else setError(res.error ?? "Kunne ikke gemme placeringen.");
        });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Du afviste adgang til placering. Skriv adressen i stedet."
            : "Kunne ikke finde din placering. Skriv adressen i stedet.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function clearLocation() {
    setError(null);
    start(async () => {
      const res = await setBusinessLocation(null, null);
      if (res.ok) {
        setCoords(null);
        setSavedAddress(null);
        setAddress("");
      } else setError(res.error ?? "Kunne ikke rydde placeringen.");
    });
  }

  const busy = pending || locating;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Placering til låseskærm
        </h2>
        <p className="mt-2 max-w-md font-[200] text-[0.85rem] leading-relaxed text-stone">
          Skriv butikkens adresse, så kundens stempelkort dukker op på deres
          låseskærm, når de er i nærheden. Din butik minder selv kunden om sig
          selv, helt uden app. Du behøver ikke stå i butikken; det er adressen,
          der tæller.
        </p>
      </div>

      {coords ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-moss/10 px-3.5 py-1.5 text-[0.8rem] font-[300] text-moss">
            <PinIcon /> Placering sat
          </span>
          {savedAddress ? (
            <span className="font-[300] text-[0.82rem] text-stone">
              {savedAddress}
            </span>
          ) : (
            <span className="font-[200] text-[0.78rem] tabular-nums text-slate">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          )}
        </div>
      ) : (
        <p className="font-[200] text-[0.82rem] text-slate">
          Ingen placering sat endnu.
        </p>
      )}

      {/* Primaer: indtast adresse */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveAddress();
            }
          }}
          placeholder="Fx Nørregade 12, 8000 Aarhus"
          autoComplete="street-address"
          disabled={busy}
          className="w-full max-w-sm rounded-lg border border-fog bg-white px-4 py-2.5 font-[300] text-[0.9rem] text-ink outline-none transition-colors focus:border-moss disabled:opacity-60"
        />
        <button
          type="button"
          onClick={saveAddress}
          disabled={busy}
          className={btnClass("primary", "md") + " shrink-0 gap-2"}
        >
          <PinIcon />
          {coords ? "Opdater" : "Gem adresse"}
        </button>
      </div>

      {/* Sekundaer: brug nuvaerende placering, eller ryd */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink disabled:opacity-50"
        >
          Eller brug min nuværende placering
        </button>
        {coords ? (
          <button
            type="button"
            onClick={clearLocation}
            disabled={busy}
            className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-rust disabled:opacity-50"
          >
            Fjern placering
          </button>
        ) : null}
      </div>

      {busy ? (
        <p className="font-[300] text-[0.8rem] text-slate">
          {locating ? "Henter placering..." : "Slår adressen op..."}
        </p>
      ) : null}
      {error ? (
        <p className="font-[300] text-[0.8rem] text-rust">{error}</p>
      ) : null}
    </div>
  );
}
