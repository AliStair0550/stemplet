"use client";

/* eslint-disable @next/next/no-img-element -- logo/QR er data-URIs i praecise
   maal (mm-baseret visitkort), som ikke skal optimeres af next/image. */

import { VK_FONT_CSS, type VisitkortDesign } from "@/lib/visitkort";
import { shade } from "@/lib/brand";

// Live-preview af EEN side af visitkortet. Alt maales i cqw (procent af kortets
// bredde), saa det ser ens ud i enhver stoerrelse og spejler PDF-eksporten.
// Forsiden er butikkens oplysninger, bagsiden er stempelkortet/QR.

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
  const font = VK_FONT_CSS[design.font];
  const elR = design.corners === "afrundede" ? "3cqw" : "0";
  const outerR = design.dieCut ? "5cqw" : "0.5cqw";

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
          fontFamily: font,
          borderRadius: outerR,
          overflow: "hidden",
          boxShadow:
            "0 20px 44px -20px rgba(28,25,23,0.4), 0 2px 6px rgba(28,25,23,0.08)",
        }}
      >
        {side === "front" ? (
          <FrontSide
            design={design}
            businessName={businessName}
            logoUrl={logoUrl}
            elR={elR}
          />
        ) : (
          <BackSide
            design={design}
            businessName={businessName}
            logoUrl={logoUrl}
            qrDataUrl={qrDataUrl}
            stampsRequired={stampsRequired}
            rewardText={rewardText}
            elR={elR}
          />
        )}
      </div>
    </div>
  );
}

function Logo({
  logoUrl,
  businessName,
  h,
  color,
}: {
  logoUrl: string | null;
  businessName: string;
  h: string;
  color: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        style={{ height: h, maxWidth: "78%", objectFit: "contain" }}
      />
    );
  }
  return (
    <span style={{ fontSize: "6cqw", fontWeight: 700, lineHeight: 1.1, color }}>
      {businessName}
    </span>
  );
}

function FrontSide({
  design,
  businessName,
  logoUrl,
  elR,
}: {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  elR: string;
}) {
  const lines = contactLines(design);
  const center = design.template === "centreret";
  const align = center ? "center" : "flex-start";
  const textAlign = center ? "center" : "left";

  const info = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        textAlign,
        justifyContent: "center",
        gap: "2cqw",
        minWidth: 0,
      }}
    >
      {design.showLogo ? (
        <Logo
          logoUrl={logoUrl}
          businessName={businessName}
          h="12cqw"
          color={design.front.text}
        />
      ) : (
        <span style={{ fontSize: "6.5cqw", fontWeight: 700, lineHeight: 1.1 }}>
          {businessName}
        </span>
      )}
      {design.showLogo ? (
        <span style={{ fontSize: "5.4cqw", fontWeight: 700, lineHeight: 1.1 }}>
          {businessName}
        </span>
      ) : null}
      {design.tagline.trim() ? (
        <span style={{ fontSize: "3.4cqw", opacity: 0.85, lineHeight: 1.25 }}>
          {design.tagline}
        </span>
      ) : null}
      {lines.length ? (
        <div
          style={{
            marginTop: "1cqw",
            display: "flex",
            flexDirection: "column",
            gap: "1cqw",
            alignItems: align,
          }}
        >
          {lines.map((l, i) => (
            <span key={i} style={{ fontSize: "3.1cqw", opacity: 0.9 }}>
              {l}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (design.template === "sidebjaelke") {
    return (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div
          style={{
            width: "34%",
            background: shade(design.front.bg, -0.16),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4cqw",
          }}
        >
          <Logo
            logoUrl={logoUrl}
            businessName={businessName}
            h="16cqw"
            color={design.front.text}
          />
        </div>
        <div style={{ flex: 1, padding: "7cqw", display: "flex" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "2cqw",
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: "5.4cqw", fontWeight: 700, lineHeight: 1.1 }}>
              {businessName}
            </span>
            {design.tagline.trim() ? (
              <span style={{ fontSize: "3.4cqw", opacity: 0.85 }}>
                {design.tagline}
              </span>
            ) : null}
            {lines.length ? (
              <div
                style={{
                  marginTop: "1cqw",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1cqw",
                }}
              >
                {lines.map((l, i) => (
                  <span key={i} style={{ fontSize: "3.1cqw", opacity: 0.9 }}>
                    {l}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Wrapper med afrundet/skarp ramme-foelelse (elR bruges paa evt. indre felter;
  // her holder vi forsiden ren og laegger blot padding).
  void elR;
  return (
    <div style={{ width: "100%", height: "100%", padding: "8cqw", display: "flex" }}>
      {info}
    </div>
  );
}

function BackSide({
  design,
  businessName,
  logoUrl,
  qrDataUrl,
  stampsRequired,
  rewardText,
  elR,
}: {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  qrDataUrl: string;
  stampsRequired: number;
  rewardText: string;
  elR: string;
}) {
  const qrTile = (size: string) => (
    <div style={{ background: "#fff", borderRadius: elR, padding: "2.4cqw", lineHeight: 0 }}>
      <img src={qrDataUrl} alt="" style={{ display: "block", width: size, height: size }} />
    </div>
  );

  if (design.backContent === "qr") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "8cqw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "3cqw",
          textAlign: "center",
        }}
      >
        <Logo logoUrl={logoUrl} businessName={businessName} h="9cqw" color={design.back.text} />
        <span style={{ fontSize: "4.6cqw", fontWeight: 700, lineHeight: 1.14 }}>
          Hent dit stempelkort
        </span>
        {qrTile("32cqw")}
        <span style={{ fontSize: "3.2cqw", opacity: 0.82 }}>
          Ingen app. Ingen tilmelding.
        </span>
      </div>
    );
  }

  // Stempelkort-look: reward + rings + QR til at hente det digitale kort.
  const rings = Math.min(10, Math.max(1, stampsRequired));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "7cqw",
        display: "flex",
        gap: "5cqw",
        alignItems: "center",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2.6cqw",
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: "3cqw", opacity: 0.7, letterSpacing: "0.12em" }}>
          {businessName.toUpperCase()}
        </span>
        <span style={{ fontSize: "5cqw", fontWeight: 700, lineHeight: 1.12 }}>
          {rewardText}
        </span>
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
        {qrTile("26cqw")}
        <span style={{ fontSize: "2.6cqw", opacity: 0.82, textAlign: "center", maxWidth: "30cqw" }}>
          Scan og hent kortet
        </span>
      </div>
    </div>
  );
}
