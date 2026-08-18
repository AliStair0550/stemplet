"use client";

import { useState } from "react";
import Image from "next/image";
import { btnClass } from "@/components/ui";

export type QrItem = {
  id: string;
  name: string;
  slug: string;
  cardUrl: string;
  qrDataUrl: string;
  owner: string | null;
};

export function AdminQrGrid({ items }: { items: QrItem[] }) {
  const [q, setQ] = useState("");
  const norm = q.trim().toLowerCase();
  const filtered = norm
    ? items.filter((i) =>
        `${i.name} ${i.slug} ${i.owner ?? ""}`.toLowerCase().includes(norm),
      )
    : items;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative max-w-sm">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg efter butik, slug eller email"
          className="w-full rounded-md border border-fog bg-white px-3.5 py-2.5 font-[300] text-[0.88rem] text-ink outline-none focus:border-terracotta"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
          Ingen butikker matcher {`"${q}"`}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="flex flex-col gap-3 rounded-lg border border-fog bg-white p-5 shadow-card"
            >
              <div className="mx-auto rounded-lg border border-fog bg-white p-2">
                <Image
                  src={i.qrDataUrl}
                  width={168}
                  height={168}
                  alt={`QR til ${i.name}`}
                  unoptimized
                  className="h-40 w-40"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate font-[400] text-[0.95rem] text-ink">
                  {i.name}
                </p>
                <a
                  href={i.cardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[0.78rem] font-[300] text-terracotta transition-opacity hover:opacity-70"
                >
                  /k/{i.slug}
                </a>
                {i.owner ? (
                  <a
                    href={`mailto:${i.owner}`}
                    className="block truncate text-[0.76rem] font-[300] text-slate transition-colors hover:text-ink"
                  >
                    {i.owner}
                  </a>
                ) : null}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <a
                  href={i.qrDataUrl}
                  download={`stemplet-qr-${i.slug}.png`}
                  className={`${btnClass("outline")} w-full`}
                >
                  Hent QR-kode
                </a>
                <p className="text-center text-[0.74rem] font-[300] text-slate">
                  Print:{" "}
                  <a
                    href={`/api/qr-print/visitkort?slug=${i.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-terracotta underline underline-offset-2 hover:opacity-70"
                  >
                    Visitkort
                  </a>{" "}
                  ·{" "}
                  <a
                    href={`/api/qr-print/a4?slug=${i.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-terracotta underline underline-offset-2 hover:opacity-70"
                  >
                    A4-plakat
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
