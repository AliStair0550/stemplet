import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";

// Delings-billede (1200x630) for kort.folka.dk: Folka | Kort, overskrift og
// et kundekort med stempler. Vises naar et link deles paa fx iMessage, Slack,
// Facebook, LinkedIn og X.
export const runtime = "nodejs";
export const alt = "Folka Kort: dit eget kundekort";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#061C3D";
const SAND = "#EFEBE3";
const INK = "#1E2633";
const TINT = "#EAF1FB";

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const icon = (key: keyof typeof STAMP_ICON_PATHS, color: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="${color}">${STAMP_ICON_PATHS[key]}</svg>`,
  );

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "folka-logo-hvid.svg"));
  const logoUri = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const filled = icon("coffee", SAND);
  const empty = icon("coffee", "rgba(30,38,51,0.32)");
  const gift = icon("gift", "rgba(30,38,51,0.45)");

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
        {/* Venstre: Folka | Kort + overskrift */}
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUri} height={52} width={94} alt="" />
            <div style={{ display: "flex", width: 2, height: 34, background: "rgba(234,241,251,0.35)", margin: "0 22px" }} />
            <div style={{ display: "flex", fontSize: 30, color: "rgba(234,241,251,0.8)" }}>Kort</div>
          </div>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.08, fontWeight: 700, color: TINT, marginTop: 44, letterSpacing: -2 }}>
            Dit kort. Dine kunder. Din kanal.
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "rgba(234,241,251,0.72)", marginTop: 26 }}>
            Folka Kort er dit eget kundekort.
          </div>
        </div>

        {/* Hoejre: kundekortet */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            background: SAND,
            borderRadius: 30,
            padding: "34px 34px 30px",
            boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
            transform: "rotate(-3deg)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: INK }}>Café Sol</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 13, color: "rgba(30,38,51,0.6)", letterSpacing: 1 }}>STEMPLER</div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: INK }}>7/10</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: i < 7 ? INK : "transparent",
                  border: i < 7 ? "none" : "2px solid rgba(30,38,51,0.22)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i === 9 ? gift : i < 7 ? filled : empty} width={28} height={28} alt="" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 18, borderTop: "1.5px solid rgba(30,38,51,0.14)" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 13, color: "rgba(30,38,51,0.6)", letterSpacing: 1 }}>BELØNNING</div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: INK }}>10. kop er gratis</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 13, color: "rgba(30,38,51,0.6)", letterSpacing: 1 }}>HENVIS EN VEN</div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: INK }}>EMMA-K7</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
