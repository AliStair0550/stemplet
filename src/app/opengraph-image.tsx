import { ImageResponse } from "next/og";

// Delings-billede (1200x630): stempelkortet fra hero + overskrift. Vises naar
// forsiden deles paa fx iMessage, Slack, Facebook, LinkedIn, X. Kun ASCII-dansk
// i teksten, saa standard-fonten kan tegne alt.
export const runtime = "nodejs";
export const alt = "Stemplet, stempelkortet der skaber flere gensyn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAMPS = [true, true, true, true, true, true, true, false, false, false];

export default function OpengraphImage() {
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
        }}
      >
        {/* Venstre: brand + overskrift */}
        <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#1A1A1A" }}>
            Stemplet
            <span style={{ display: "flex", color: "#A6502E" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              lineHeight: 1.12,
              fontWeight: 600,
              color: "#1A1A1A",
              marginTop: 30,
            }}
          >
            Stempelkortet, der skaber flere gensyn.
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#4A4A4A", marginTop: 26 }}>
            Digitalt stempelkort i Apple Wallet. Ingen app.
          </div>
        </div>

        {/* Hoejre: selve stempelkortet */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            background: "#2A1A10",
            borderRadius: 28,
            padding: "34px 36px",
            boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "#F6EEE4" }}>
              Coffee Lab
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "rgba(246,238,228,0.7)" }}>
              7/10
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "#F6EEE4", marginTop: 18 }}>
            10. kop er gratis
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
            {STAMPS.map((filled, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: filled ? "#F6EEE4" : "transparent",
                  border: filled ? "none" : "2px solid rgba(246,238,228,0.35)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: filled ? "#2A1A10" : "rgba(246,238,228,0.35)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
