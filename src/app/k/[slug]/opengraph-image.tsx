import { ImageResponse } from "next/og";
import { cardShortName, claimCta } from "@/lib/card-name";
import { prisma } from "@/lib/prisma";
import { cardTitle } from "@/lib/brand";
import { ogIcon, ogRgba } from "@/lib/og";

// Delings-billede (1200x630) for butikkens side: naar linket deles paa iMessage,
// Facebook, Instagram osv., vises butikkens kort i egne farver med en klar
// opfordring ("Hent dit X-kort"), saa folk ved, hvad de faar.
export const runtime = "nodejs";
export const alt = "Hent kortet i Apple Wallet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Cache billedet: genereres een gang pr. dag pr. butik, ikke ved hver deling.
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 } },
  });

  const name = business ? cardTitle(business) : "Folka Kort";
  const bg = business?.primaryColor ?? "#061C3D";
  const fg = business?.textColor ?? "#EAF1FB";
  const card = business?.cards[0];
  const stamps = business?.stampsEnabled !== false && card;
  const required = Math.min(card?.stampsRequired ?? 10, 10);
  const cta = business ? claimCta(cardShortName(business)) : "Hent dit kort";
  const empty = ogIcon(card?.stampIcon ?? "coffee", ogRgba(fg, 0.45));
  const gift = ogIcon("gift", fg);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `radial-gradient(ellipse 80% 90% at 10% 0%, ${ogRgba(fg, 0.09)} 0%, ${bg} 60%)`,
          backgroundColor: bg,
          color: fg,
          padding: "64px 76px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: ogRgba(fg, 0.75) }}>{name}</div>
          <div style={{ display: "flex", fontSize: 58, lineHeight: 1.08, fontWeight: 700, marginTop: 22, letterSpacing: -2 }}>
            {cta}
          </div>
          {stamps && card ? (
            <div style={{ display: "flex", fontSize: 30, marginTop: 26 }}>
              {card.rewardText} efter {card.stampsRequired} stempler
            </div>
          ) : null}
          <div style={{ display: "flex", fontSize: 24, color: ogRgba(fg, 0.7), marginTop: 16 }}>
            Ligger i Apple Wallet på få sekunder. Ingen app.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            background: ogRgba(fg, 0.1),
            border: `2px solid ${ogRgba(fg, 0.2)}`,
            borderRadius: 30,
            padding: "34px 34px 30px",
            transform: "rotate(-3deg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 24, color: ogRgba(fg, 0.7) }}>0/{required}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            {Array.from({ length: required }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${ogRgba(fg, i === required - 1 ? 0.7 : 0.3)}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i === required - 1 ? gift : empty} width={28} height={28} alt="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
