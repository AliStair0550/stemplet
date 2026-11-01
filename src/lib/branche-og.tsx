import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { STAMP_ICON_PATHS } from "./stamp-icon-paths";
import type { BrancheContent } from "./brancher";

// Delebillede (1200x630) til en brancheside: Folka | Kort, sidens noegleord
// ("Stempelkort til frisører") og branchens eksempelkort. Vises, naar siden
// deles paa fx Facebook, LinkedIn og Messenger.

export const OG_SIZE = { width: 1200, height: 630 };

const NAVY = "#061C3D";
const TINT = "#EAF1FB";

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const icon = (key: string, color: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="${color}">${STAMP_ICON_PATHS[key as keyof typeof STAMP_ICON_PATHS] ?? STAMP_ICON_PATHS.coffee}</svg>`,
  );

export async function brancheOgImage(b: BrancheContent): Promise<ImageResponse> {
  const logo = await readFile(path.join(process.cwd(), "public", "folka-logo-hvid.svg"));
  const logoUri = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const card = b.cardExample ?? {
    businessName: b.shortName,
    primaryColor: "#EFEBE3",
    textColor: "#1E2633",
    stampIcon: "coffee",
    required: 10,
    stamps: 6,
    rewardText: "Din belønning",
  };
  const fg = card.textColor;
  const bg = card.primaryColor;
  const filled = icon(card.stampIcon, bg);
  const empty = icon(card.stampIcon, `${fg}55`);
  const gift = icon("gift", `${fg}88`);
  const required = Math.min(card.required, 10);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `radial-gradient(ellipse 70% 90% at 15% 0%, #0A2D5A 0%, ${NAVY} 60%)`,
          padding: "60px 76px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 610 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUri} height={52} width={94} alt="" />
            <div style={{ display: "flex", width: 2, height: 34, background: "rgba(234,241,251,0.35)", margin: "0 22px" }} />
            <div style={{ display: "flex", fontSize: 30, color: "rgba(234,241,251,0.8)" }}>Kort</div>
          </div>
          <div style={{ display: "flex", fontSize: 62, lineHeight: 1.08, fontWeight: 700, color: TINT, marginTop: 44, letterSpacing: -2 }}>
            {b.eyebrow}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "rgba(234,241,251,0.72)", marginTop: 24 }}>{b.cardTeaser}</div>
          <div style={{ display: "flex", fontSize: 22, color: "rgba(234,241,251,0.55)", marginTop: 28 }}>
            Stempler, henvisninger og beskeder i Apple Wallet.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 390,
            background: bg,
            borderRadius: 30,
            padding: "34px 34px 30px",
            boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
            transform: "rotate(-3deg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: fg }}>{card.businessName}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 13, color: fg, opacity: 0.65, letterSpacing: 1 }}>STEMPLER</div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: fg }}>
                {card.stamps}/{card.required}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            {Array.from({ length: required }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: i < card.stamps ? fg : "transparent",
                  border: i < card.stamps ? "none" : `2px solid ${fg}44`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i === required - 1 ? gift : i < card.stamps ? filled : empty} width={27} height={27} alt="" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, paddingTop: 16, borderTop: `1.5px solid ${fg}26` }}>
            <div style={{ display: "flex", fontSize: 13, color: fg, opacity: 0.65, letterSpacing: 1 }}>BELØNNING</div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: fg }}>{card.rewardText}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
