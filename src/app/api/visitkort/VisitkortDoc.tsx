import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Rect,
} from "@react-pdf/renderer";
import {
  pdfFamily,
  cornerRadiusMm,
  type VisitkortDesign,
} from "@/lib/visitkort";
import { shade } from "@/lib/brand";

const MM = 72 / 25.4;
const BLEED = 3 * MM;

export type QrMatrix = { size: number; data: Uint8Array | number[] };

type DocProps = {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  rewardText: string;
  stampsRequired: number;
  qr: QrMatrix;
};

// QR som vektor (moerk paa hvid), saa koden er knivskarp og altid scanbar.
function QrVector({ matrix, size }: { matrix: QrMatrix; size: number }) {
  const n = matrix.size;
  const data = matrix.data;
  const cell = size / n;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    let run = -1;
    for (let c = 0; c <= n; c++) {
      const dark = c < n && !!data[r * n + c];
      if (dark && run < 0) run = c;
      if (!dark && run >= 0) {
        rects.push(
          <Rect key={`${r}-${run}`} x={run * cell} y={r * cell} width={(c - run) * cell} height={cell} fill="#111111" />,
        );
        run = -1;
      }
    }
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
      {rects}
    </Svg>
  );
}

function cropMarks(pageW: number, pageH: number) {
  const L = BLEED;
  const w = 0.5;
  const inset = BLEED;
  const corners = [
    { x: inset, y: inset, sx: -1, sy: -1 },
    { x: pageW - inset, y: inset, sx: 1, sy: -1 },
    { x: inset, y: pageH - inset, sx: -1, sy: 1 },
    { x: pageW - inset, y: pageH - inset, sx: 1, sy: 1 },
  ];
  const bars: React.ReactNode[] = [];
  corners.forEach((c, i) => {
    bars.push(
      <View key={`h${i}`} style={{ position: "absolute", top: c.y - w / 2, left: c.sx < 0 ? c.x - L : c.x, width: L, height: w, backgroundColor: "#000" }} />,
    );
    bars.push(
      <View key={`v${i}`} style={{ position: "absolute", left: c.x - w / 2, top: c.sy < 0 ? c.y - L : c.y, width: w, height: L, backgroundColor: "#000" }} />,
    );
  });
  return bars;
}

function Brandmark({
  design,
  businessName,
  logoUrl,
  logoH,
  nameSize,
}: {
  design: VisitkortDesign;
  businessName: string;
  logoUrl: string | null;
  logoH: number;
  nameSize: number;
}) {
  if (design.showLogo && logoUrl) {
    return <Image src={logoUrl} style={{ height: logoH, maxWidth: logoH * 4.2, objectFit: "contain" }} />;
  }
  return (
    <Text style={{ fontFamily: pdfFamily(design.font, true), fontWeight: 700, fontSize: nameSize, color: colorOf(design, "front") }}>
      {businessName}
    </Text>
  );
}

function colorOf(design: VisitkortDesign, side: "front" | "back"): string {
  return side === "front" ? design.front.text : design.back.text;
}

function contactLines(d: VisitkortDesign): string[] {
  return [d.phone, d.email, d.web, d.address].map((s) => s.trim()).filter(Boolean);
}

// ── Forside: butikkens oplysninger ────────────────────────────────────────
function FrontPage({ props, pageW, pageH, pad }: { props: DocProps; pageW: number; pageH: number; pad: number }) {
  const { design, businessName, logoUrl } = props;
  const text = design.front.text;
  const lines = contactLines(design);
  const fam = (bold: boolean) => pdfFamily(design.font, bold);
  const center = design.template === "centreret";

  const nameEl = (
    <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 13, lineHeight: 1.1, color: text }}>
      {businessName}
    </Text>
  );
  const taglineEl = design.tagline.trim() ? (
    <Text style={{ fontFamily: fam(false), fontSize: 8, color: text, opacity: 0.85, marginTop: 2 * MM }}>
      {design.tagline}
    </Text>
  ) : null;
  const contactEl = lines.length ? (
    <View style={{ marginTop: 3 * MM, flexDirection: "column", gap: 1.4 * MM }}>
      {lines.map((l, i) => (
        <Text key={i} style={{ fontFamily: fam(false), fontSize: 7.5, color: text, opacity: 0.9 }}>
          {l}
        </Text>
      ))}
    </View>
  ) : null;

  let body: React.ReactNode;
  if (design.template === "sidebjaelke") {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, flexDirection: "row" }}>
        <View style={{ width: pageW * 0.36, backgroundColor: shade(design.front.bg, -0.16), alignItems: "center", justifyContent: "center", padding: 6 * MM }}>
          <Brandmark design={design} businessName={businessName} logoUrl={logoUrl} logoH={12 * MM} nameSize={12} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingVertical: BLEED + 5 * MM, paddingHorizontal: 6 * MM }}>
          {nameEl}
          {taglineEl}
          {contactEl}
        </View>
      </View>
    );
  } else {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, alignItems: center ? "center" : "flex-start", justifyContent: "center" }}>
        {design.showLogo && logoUrl ? (
          <View style={{ marginBottom: 2.5 * MM, alignItems: center ? "center" : "flex-start" }}>
            <Brandmark design={design} businessName={businessName} logoUrl={logoUrl} logoH={11 * MM} nameSize={13} />
          </View>
        ) : null}
        <View style={{ alignItems: center ? "center" : "flex-start" }}>{nameEl}</View>
        <View style={{ alignItems: center ? "center" : "flex-start" }}>{taglineEl}</View>
        <View style={{ alignItems: center ? "center" : "flex-start", width: "100%" }}>
          {lines.length ? (
            <View style={{ marginTop: 3 * MM, flexDirection: "column", gap: 1.4 * MM, alignItems: center ? "center" : "flex-start" }}>
              {lines.map((l, i) => (
                <Text key={i} style={{ fontFamily: fam(false), fontSize: 7.5, color: text, opacity: 0.9 }}>
                  {l}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <Page size={[pageW, pageH]}>
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, backgroundColor: design.front.bg }} />
      {body}
      {cropMarks(pageW, pageH)}
    </Page>
  );
}

// ── Bagside: stempelkort eller ren QR ─────────────────────────────────────
function BackPage({ props, pageW, pageH, pad }: { props: DocProps; pageW: number; pageH: number; pad: number }) {
  const { design, businessName, logoUrl, rewardText, stampsRequired, qr } = props;
  const text = design.back.text;
  const fam = (bold: boolean) => pdfFamily(design.font, bold);
  const elR = cornerRadiusMm(design.corners) * MM;
  const qrTile = (size: number) => (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: elR, padding: 1.8 * MM }}>
      <QrVector matrix={qr} size={size} />
    </View>
  );

  let body: React.ReactNode;
  if (design.backContent === "qr") {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, alignItems: "center", justifyContent: "center" }}>
        <View style={{ marginBottom: 3 * MM, alignItems: "center" }}>
          <Brandmark design={design} businessName={businessName} logoUrl={logoUrl} logoH={9 * MM} nameSize={11} />
        </View>
        <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 12, color: text, textAlign: "center", marginBottom: 3 * MM }}>
          Hent dit stempelkort
        </Text>
        {qrTile(26 * MM)}
        <Text style={{ fontFamily: fam(false), fontSize: 7.5, color: text, opacity: 0.82, marginTop: 3 * MM, textAlign: "center" }}>
          Ingen app. Ingen tilmelding.
        </Text>
      </View>
    );
  } else {
    const rings = Math.min(10, Math.max(1, stampsRequired));
    const ringSize = 5.5 * MM;
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, flexDirection: "row", alignItems: "center", gap: 5 * MM }}>
        <View style={{ flex: 1, flexDirection: "column", gap: 2.4 * MM }}>
          <Text style={{ fontFamily: fam(false), fontSize: 6.5, color: text, opacity: 0.7, letterSpacing: 0.6 }}>
            {businessName.toUpperCase()}
          </Text>
          <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 12, color: text, lineHeight: 1.12 }}>
            {rewardText}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 * MM, marginTop: 1 * MM }}>
            {Array.from({ length: rings }).map((_, i) => (
              <View key={i} style={{ width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderWidth: 0.7, borderColor: text, opacity: 0.55 }} />
            ))}
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          {qrTile(22 * MM)}
          <Text style={{ fontFamily: fam(false), fontSize: 6.5, color: text, opacity: 0.82, marginTop: 1.6 * MM, textAlign: "center", maxWidth: 24 * MM }}>
            Scan og hent kortet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Page size={[pageW, pageH]}>
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, backgroundColor: design.back.bg }} />
      {body}
      {cropMarks(pageW, pageH)}
    </Page>
  );
}

export function VisitkortDoc(props: DocProps) {
  const land = props.design.orientation === "landscape";
  const trimW = (land ? 85 : 55) * MM;
  const trimH = (land ? 55 : 85) * MM;
  const pageW = trimW + BLEED * 2;
  const pageH = trimH + BLEED * 2;
  const pad = BLEED + 4.5 * MM;

  return (
    <Document>
      {FrontPage({ props, pageW, pageH, pad })}
      {BackPage({ props, pageW, pageH, pad })}
    </Document>
  );
}
