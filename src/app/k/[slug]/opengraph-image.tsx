import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// Delings-billede (1200x630) for tilmeldings-siden: naar butikken deler linket
// paa iMessage, Facebook, Instagram osv., vises butikkens eget stempelkort med
// navn og beloenning, saa folk kan trykke og hente kortet direkte.
export const runtime = "nodejs";
export const alt = "Dit digitale stempelkort";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Cache billedet: font-hentning + generering sker een gang pr. dag pr. butik,
// ikke ved hver deling/crawl (foer tog det ~1,7 sek. hver gang).
export const revalidate = 86400;

// Henter Jost (brand-fonten), saa danske tegn (aeoeaa/accenter) i butiksnavn og
// beloenning tegnes korrekt. Fejler hentningen, falder vi tilbage til standard-
// fonten, og billedet genereres stadig.
async function loadJost(
  weight: 400 | 600,
): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" } | null
> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Jost:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: ctrl.signal },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) {
      clearTimeout(timer);
      return null;
    }
    const data = await fetch(url, { signal: ctrl.signal }).then((r) =>
      r.arrayBuffer(),
    );
    clearTimeout(timer);
    return { name: "Jost", data, weight, style: "normal" };
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  const name = business?.name ?? "Stempelkort";
  const primary = business?.primaryColor ?? "#061C3D";
  const fg = business?.textColor ?? "#FFFFFF";
  const reward = business?.cards[0]?.rewardText ?? "";
  const required = Math.min(business?.cards[0]?.stampsRequired ?? 10, 10);

  const loaded = (await Promise.all([loadJost(400), loadJost(600)])).filter(
    (f): f is NonNullable<typeof f> => f !== null,
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FAF8F4",
          padding: "64px 76px",
          fontFamily: loaded.length ? "Jost" : undefined,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 610 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 3,
              color: "#2D5F4A",
              fontWeight: 600,
            }}
          >
            STEMPELKORT
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              lineHeight: 1.1,
              fontWeight: 600,
              color: "#1A1A1A",
              marginTop: 22,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#4A4A4A",
              marginTop: 26,
            }}
          >
            Hent dit stempelkort direkte i Apple Wallet.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#8A8A8A",
              marginTop: 14,
            }}
          >
            Ingen app. Ingen tilmelding.
          </div>
        </div>

        {/* Selve stempelkortet i butikkens farver */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            background: primary,
            color: fg,
            borderRadius: 28,
            padding: "34px 36px",
            boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 20, opacity: 0.7 }}>
              0/{required}
            </div>
          </div>
          {reward ? (
            <div style={{ display: "flex", fontSize: 26, marginTop: 18 }}>
              {reward}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 26,
            }}
          >
            {Array.from({ length: required }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 50,
                  height: 50,
                  borderRadius: 999,
                  border: `2px solid ${fg}`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: loaded.length ? loaded : undefined },
  );
}
