import { ImageResponse } from "next/og";
import { ogIcon, ogRgba } from "@/lib/og";
import { loadInvite } from "./load";
import { safeDecode } from "@/lib/utils";

// Delings-billede for "Henvis en ven": gaven til vennen i butikkens farver, saa
// det i beskeden er tydeligt, at der ligger en rabat klar.
export const runtime = "nodejs";
export const alt = "Du har faaet en gave";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code } = await params;
  const invite = await loadInvite(slug, safeDecode(code));
  const bg = invite?.primaryColor ?? "#061C3D";
  const fg = invite?.textColor ?? "#EAF1FB";
  const who = invite?.friend ?? "Din ven";
  const gift = ogIcon("gift", bg);

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
        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: ogRgba(fg, 0.75) }}>{invite?.shop ?? "Kundekort"}</div>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.06, fontWeight: 700, marginTop: 22, letterSpacing: -2 }}>
            {invite?.gift ? `${who} har givet dig ${invite.gift}` : `${who} inviterer dig`}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: ogRgba(fg, 0.78), marginTop: 26 }}>
            Hent kortet, og brug rabatten ved første besøg.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            background: fg,
            color: bg,
            borderRadius: 40,
            transform: "rotate(-4deg)",
            boxShadow: "0 40px 90px rgba(0,0,0,0.4)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gift} width={110} height={110} alt="" />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, marginTop: 18, letterSpacing: -2 }}>{invite?.gift ?? "Gave"}</div>
          <div style={{ display: "flex", fontSize: 24, marginTop: 6, color: ogRgba(bg, 0.7) }}>ved første besøg</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
