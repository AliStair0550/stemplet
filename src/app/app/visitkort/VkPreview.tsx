"use client";

/* eslint-disable @next/next/no-img-element -- logo/QR er data-URIs i praecise
   maal (mm-baseret visitkort), som ikke skal optimeres af next/image. */

import { VK_FONT_CSS, type VisitkortDesign } from "@/lib/visitkort";
import { shade } from "@/lib/brand";

// Live-preview af EEN side af visitkortet. Alt maales i cqmax (procent af kortets
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
          containerType: "size",
          width: "100%",
          maxWidth: land ? 380 : 250,
          aspectRatio: land ? "85 / 55" : "55 / 85",
          background: colors.bg,
          color: colors.text,
          fontFamily: VK_FONT_CSS[design.font],
          borderRadius: design.dieCut ? "5cqmax" : "0.5cqmax",
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
  return <span style={{ fontSize: "6.4cqmax", fontWeight: 700, lineHeight: 1.05 }}>{businessName}</span>;
}

function Tagline({ design }: { design: VisitkortDesign }) {
  const t = design.tagline.trim();
  const a = design.taglineAccent.trim();
  if (!t && !a) return null;
  return (
    <span style={{ fontSize: "3.3cqmax", fontWeight: design.taglineBold ? 700 : 400, opacity: 0.9, lineHeight: 1.3 }}>
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

function Contact({ design, align }: { design: VisitkortDesign; align: "flex-start" | "center" | "flex-end" }) {
  const lines = contactLines(design);
  const hasName = design.name.trim().length > 0;
  if (!hasName && !lines.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1cqmax", alignItems: align }}>
      {hasName ? (
        <span style={{ fontSize: "4.6cqmax", fontWeight: design.nameBold ? 700 : 400, lineHeight: 1.1, marginBottom: "0.6cqmax" }}>
          {design.name}
        </span>
      ) : null}
      {lines.map((l, i) => (
        <span key={i} style={{ fontSize: "3cqmax", opacity: 0.82 }}>
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
  const t = design.template;
  const center = t === "centreret";
  const right = t === "hoejre";
  const align: "flex-start" | "center" | "flex-end" = center
    ? "center"
    : right
      ? "flex-end"
      : "flex-start";
  const logoH = `${12 * design.logoScale}cqmax`;
  // Fleksibel afstand der fylder ledig plads, men skrumper til 0 hvis indholdet
  // er stort, saa tekst aldrig lander oven paa hinanden (kun klippes i kanten).
  const spacer = <div style={{ flex: "1 1 0", minHeight: 0 }} />;

  if (t === "sidebjaelke") {
    return (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div
          style={{
            width: "34%",
            background: shade(design.front.bg, -0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4cqmax",
          }}
        >
          <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={`${15 * design.logoScale}cqmax`} />
        </div>
        <div
          style={{
            flex: 1,
            padding: "7cqmax",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "2.4cqmax",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span style={{ fontSize: "5.2cqmax", fontWeight: 700, lineHeight: 1.1 }}>{businessName}</span>
          <Tagline design={design} />
          <div style={{ marginTop: "1cqmax" }}>
            <Contact design={design} align="flex-start" />
          </div>
        </div>
      </div>
    );
  }

  if (t === "topbaand") {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        <div
          style={{
            background: shade(design.front.bg, -0.1),
            padding: "5cqmax 8cqmax",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={`${9 * design.logoScale}cqmax`} />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "7cqmax 8cqmax", display: "flex", flexDirection: "column" }}>
          <div style={{ flexShrink: 0 }}>
            <Tagline design={design} />
          </div>
          {spacer}
          <div style={{ flexShrink: 0 }}>
            <Contact design={design} align="flex-start" />
          </div>
        </div>
      </div>
    );
  }

  if (t === "split") {
    return (
      <div style={{ width: "100%", height: "100%", padding: "8cqmax", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "2.2cqmax", alignItems: "flex-start" }}>
          <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={logoH} />
          <Tagline design={design} />
        </div>
        {spacer}
        <div style={{ flexShrink: 0 }}>
          <Contact design={design} align="flex-start" />
        </div>
      </div>
    );
  }

  // venstre / hoejre / centreret: alt samlet, lodret centreret
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "8cqmax",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align,
        textAlign: center ? "center" : right ? "right" : "left",
        gap: "2.4cqmax",
        overflow: "hidden",
      }}
    >
      <Brand design={design} businessName={businessName} logoUrl={logoUrl} h={logoH} />
      <Tagline design={design} />
      <div style={{ marginTop: "1cqmax" }}>
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
  const elR = design.corners === "afrundede" ? "3cqmax" : "0";
  const qrTile = (size: string) => (
    <div
      style={{
        background: "#fff",
        borderRadius: elR,
        padding: "2.6cqmax",
        lineHeight: 0,
        boxShadow: "0 4cqmax 10cqmax -6cqmax rgba(0,0,0,0.35)",
      }}
    >
      <img src={qrDataUrl} alt="" style={{ display: "block", width: size, height: size }} />
    </div>
  );

  if (design.backContent === "stempelkort") {
    const rings = Math.min(10, Math.max(1, stampsRequired));
    return (
      <div style={{ width: "100%", height: "100%", padding: "7cqmax", display: "flex", gap: "5cqmax", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.6cqmax", minWidth: 0 }}>
          <span style={{ fontSize: "3cqmax", opacity: 0.7, letterSpacing: "0.12em" }}>
            {businessName.toUpperCase()}
          </span>
          <span style={{ fontSize: "5cqmax", fontWeight: 700, lineHeight: 1.12 }}>{rewardText}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2.2cqmax", maxWidth: "100%" }}>
            {Array.from({ length: rings }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: "6cqmax",
                  height: "6cqmax",
                  borderRadius: "50%",
                  border: `0.5cqmax solid ${design.back.text}`,
                  opacity: 0.55,
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6cqmax" }}>
          {qrTile(`${26 * design.qrScale}cqmax`)}
          <span style={{ fontSize: "2.6cqmax", opacity: 0.82, textAlign: "center", maxWidth: "30cqmax" }}>
            Scan og hent kortet
          </span>
        </div>
      </div>
    );
  }

  // qr: overskrift + QR + to linjer (som dit eget kort). Fleksible afstande
  // (flex-spacers) i stedet for space-between, saa intet lander oven paa hinanden.
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "8cqmax",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <span style={{ flexShrink: 0, fontSize: "4.6cqmax", fontWeight: design.headlineBold ? 700 : 400, lineHeight: 1.16 }}>
        {design.backHeadline}
        {design.backHeadlineAccent.trim() ? (
          <>
            {design.backHeadline.trim() ? " " : ""}
            <span style={{ color: design.back.accent }}>{design.backHeadlineAccent}</span>
          </>
        ) : null}
      </span>
      <div style={{ flex: "1 1 0", minHeight: "3cqmax" }} />
      <div style={{ flexShrink: 0 }}>{qrTile(`${31 * design.qrScale}cqmax`)}</div>
      <div style={{ flex: "1 1 0", minHeight: "3cqmax" }} />
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.6cqmax" }}>
        {design.backLine1.trim() ? (
          <span style={{ fontSize: "3.4cqmax", fontWeight: design.line1Bold ? 700 : 400 }}>{design.backLine1}</span>
        ) : null}
        {design.backLine2.trim() ? (
          <span style={{ fontSize: "3cqmax", fontWeight: design.line2Bold ? 700 : 400, opacity: 0.7 }}>{design.backLine2}</span>
        ) : null}
      </div>
    </div>
  );
}
