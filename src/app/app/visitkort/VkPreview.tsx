"use client";

/* eslint-disable @next/next/no-img-element -- logo/QR er data-URIs i praecise
   maal (mm-baseret visitkort), som ikke skal optimeres af next/image. */

import { VK_FONT_CSS, type VisitkortDesign } from "@/lib/visitkort";
import { shade } from "@/lib/brand";

// Live-preview af EEN side af visitkortet. Alt maales i cqw (procent af kortets
// bredde), saa det ser ens ud i enhver stoerrelse og spejler PDF-eksporten.

type Props = {
  side: "front" | "back";
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  qrDataUrl: string;
  stampsRequired: number;
  rewardText: string;
};

function contactLines(d: VisitkortDesign): string[] {
  return [d.phone, d.email, d.web, d.address].map((s) => s.trim()).filter(Boolean);
}

export function VkPreview({
  side,
  design,
  businessName,
  logoUrl,
  qrDataUrl,
  stampsRequired,
  rewardText,
}: Props) {
  const land = design.orientation === "landscape";
  const colors = side === "front" ? design.front : design.back;

  return (
    <div className="flex w-full justify-center">
      <div
        style={{
          containerType: "inline-size",
          width: "100%",
          maxWidth: land ? 380 : 250,
          aspectRatio: land ? "85 / 55" : "55 / 85",
          background: colors.bg,
          color: colors.text,
          fontFamily: VK_FONT_CSS[design.font],
          borderRadius: design.dieCut ? "5cqw" : "0.5cqw",
          overflow: "hidden",
          boxShadow:
            "0 20px 44px -20px rgba(28,25,23,0.4), 0 2px 6px rgba(28,25,23,0.08)",
        }}
      >
        {side === "front" ? (
          <FrontSide design={design} businessName={businessName} logoUrl={logoUrl} />
        ) : (
          <BackSide
            design={design}
            businessName={businessName}
            qrDataUrl={qrDataUrl}
            stampsRequired={stampsRequired}
            rewardText={rewardText}
          />
        )}
      </div>
    </div>
  );
}

function Brand({
  design,
  businessName,
  logoUrl,
  h,
}: {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  h: string;
}) {
  if (design.showLogo && logoUrl) {
    return <img src={logoUrl} alt="" style={{ height: h, maxWidth: "82%", objectFit: "contain" }} />;
  }
  return <span style={{ fontSize: "6.4cqw", fontWeight: 700, lineHeight: 1.05 }}>{businessName}</span>;
}

function Tagline({ design }: { design: VisitkortDesign }) {
  const t = design.tagline.trim();
  const a = design.taglineAccent.trim();
  if (!t && !a) return null;
  return (
    <span style={{ fontSize: "3.3cqw", fontWeight: design.taglineBold ? 700 : 400, opacity: 0.9, lineHeight: 1.3 }}>
      {t}
      {a ? (
        <>
          {t ? " " : ""}
          <span style={{ color: design.front.accent, opacity: 1 }}>{a}</span>
        </>
      ) : null}
    </span>
  );
}

function Contact({ design, align }: { design: VisitkortDesign; align: "flex-start" | "center" }) {
  const lines = contactLines(design);
  const hasName = design.name.trim().length > 0;
  if (!hasName && !lines.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1cqw", alignItems: align }}>
      {hasName ? (
        <span style={{ fontSize: "4.6cqw", fontWeight: design.nameBold ? 700 : 400, lineHeight: 1.1, marginBottom: "0.6cqw" }}>
          {design.name}
        </span>
      ) : null}
      {lines.map((l, i) => (
        <span key={i} style={{ fontSize: "3cqw", opacity: 0.82 }}>
          {l}
        </span>
      ))}
    </div>
  );
}

function FrontSide({
  design,
  businessName,
  logoUrl,
}: {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
}) {
  const center = design.template === "centreret";
  const align = center ? "center" : "flex-start";

  if (design.template === "sidebjaelke") {
    return (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div
          style={{
            width: "34%",
            background: shade(design.front.bg, -0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4cqw",
          }}
        >
          <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={`${15 * design.logoScale}cqw`} />
        </div>
        <div
          style={{
            flex: 1,
            padding: "7cqw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "2.4cqw",
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: "5.2cqw", fontWeight: 700, lineHeight: 1.1 }}>{businessName}</span>
          <Tagline design={design} />
          <div style={{ marginTop: "1cqw" }}>
            <Contact design={design} align="flex-start" />
          </div>
        </div>
      </div>
    );
  }

  if (design.template === "split") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "8cqw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2.2cqw", alignItems: "flex-start" }}>
          <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={`${12 * design.logoScale}cqw`} />
          <Tagline design={design} />
        </div>
        <Contact design={design} align="flex-start" />
      </div>
    );
  }

  // venstre / centreret: alt samlet, lodret centreret
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "8cqw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align,
        textAlign: center ? "center" : "left",
        gap: "2.4cqw",
      }}
    >
      <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={`${12 * design.logoScale}cqw`} />
      <Tagline design={design} />
      <div style={{ marginTop: "1cqw" }}>
        <Contact design={design} align={align} />
      </div>
    </div>
  );
}

function BackSide({
  design,
  businessName,
  qrDataUrl,
  stampsRequired,
  rewardText,
}: {
  design: VisitkortDesign;
  businessName: string;
  qrDataUrl: string;
  stampsRequired: number;
  rewardText: string;
}) {
  const elR = design.corners === "afrundede" ? "3cqw" : "0";
  const qrTile = (size: string) => (
    <div
      style={{
        background: "#fff",
        borderRadius: elR,
        padding: "2.6cqw",
        lineHeight: 0,
        boxShadow: "0 4cqw 10cqw -6cqw rgba(0,0,0,0.35)",
      }}
    >
      <img src={qrDataUrl} alt="" style={{ display: "block", width: size, height: size }} />
    </div>
  );

  if (design.backContent === "stempelkort") {
    const rings = Math.min(10, Math.max(1, stampsRequired));
    return (
      <div style={{ width: "100%", height: "100%", padding: "7cqw", display: "flex", gap: "5cqw", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.6cqw", minWidth: 0 }}>
          <span style={{ fontSize: "3cqw", opacity: 0.7, letterSpacing: "0.12em" }}>
            {businessName.toUpperCase()}
          </span>
          <span style={{ fontSize: "5cqw", fontWeight: 700, lineHeight: 1.12 }}>{rewardText}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2.2cqw", maxWidth: "100%" }}>
            {Array.from({ length: rings }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: "6cqw",
                  height: "6cqw",
                  borderRadius: "50%",
                  border: `0.5cqw solid ${design.back.text}`,
                  opacity: 0.55,
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6cqw" }}>
          {qrTile(`${26 * design.qrScale}cqw`)}
          <span style={{ fontSize: "2.6cqw", opacity: 0.82, textAlign: "center", maxWidth: "30cqw" }}>
            Scan og hent kortet
          </span>
        </div>
      </div>
    );
  }

  // qr: overskrift + QR + to linjer (som dit eget kort)
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "8cqw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "4.6cqw", fontWeight: design.headlineBold ? 700 : 400, lineHeight: 1.16 }}>
        {design.backHeadline}
        {design.backHeadlineAccent.trim() ? (
          <>
            {design.backHeadline.trim() ? " " : ""}
            <span style={{ color: design.back.accent }}>{design.backHeadlineAccent}</span>
          </>
        ) : null}
      </span>
      {qrTile(`${31 * design.qrScale}cqw`)}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6cqw" }}>
        {design.backLine1.trim() ? (
          <span style={{ fontSize: "3.4cqw", fontWeight: design.line1Bold ? 700 : 400 }}>{design.backLine1}</span>
        ) : null}
        {design.backLine2.trim() ? (
          <span style={{ fontSize: "3cqw", fontWeight: design.line2Bold ? 700 : 400, opacity: 0.7 }}>{design.backLine2}</span>
        ) : null}
      </div>
    </div>
  );
}
