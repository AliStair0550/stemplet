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
        rects.push(<Rect key={`${r}-${run}`} x={run * cell} y={r * cell} width={(c - run) * cell} height={cell} fill="#111111" />);
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
    bars.push(<View key={`h${i}`} style={{ position: "absolute", top: c.y - w / 2, left: c.sx < 0 ? c.x - L : c.x, width: L, height: w, backgroundColor: "#000" }} />);
    bars.push(<View key={`v${i}`} style={{ position: "absolute", left: c.x - w / 2, top: c.sy < 0 ? c.y - L : c.y, width: w, height: L, backgroundColor: "#000" }} />);
  });
  return bars;
}

function contactLines(d: VisitkortDesign): string[] {
  return [d.phone, d.email, d.web, d.address].map((s) => s.trim()).filter(Boolean);
}

// ── Forside ───────────────────────────────────────────────────────────────
function FrontPage({ props, pageW, pageH, pad }: { props: DocProps; pageW: number; pageH: number; pad: number }) {
  const { design, businessName, logoUrl } = props;
  const c = design.front;
  const fam = (bold: boolean) => pdfFamily(design.font, bold);
  const lines = contactLines(design);
  const center = design.template === "centreret";
  const alignItems = center ? "center" : "flex-start";
  const textAlign = center ? ("center" as const) : ("left" as const);

  const brand = design.showLogo && logoUrl ? (
    <Image src={logoUrl} style={{ height: 11 * MM * design.logoScale, maxWidth: 46 * MM, objectFit: "contain" }} />
  ) : (
    <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 15, color: c.text }}>{businessName}</Text>
  );

  const tagline = (design.tagline.trim() || design.taglineAccent.trim()) ? (
    <Text style={{ fontFamily: fam(design.taglineBold), fontWeight: design.taglineBold ? 700 : 400, fontSize: 8, color: c.text, opacity: 0.9, textAlign }}>
      {design.tagline}
      {design.taglineAccent.trim() ? design.tagline.trim() ? " " : "" : ""}
      {design.taglineAccent.trim() ? <Text style={{ color: c.accent, opacity: 1 }}>{design.taglineAccent}</Text> : null}
    </Text>
  ) : null;

  const contact = (design.name.trim() || lines.length) ? (
    <View style={{ flexDirection: "column", gap: 1.2 * MM, alignItems }}>
      {design.name.trim() ? (
        <Text style={{ fontFamily: fam(design.nameBold), fontWeight: design.nameBold ? 700 : 400, fontSize: 11, color: c.text, marginBottom: 0.6 * MM }}>
          {design.name}
        </Text>
      ) : null}
      {lines.map((l, i) => (
        <Text key={i} style={{ fontFamily: fam(false), fontSize: 7.5, color: c.text, opacity: 0.82 }}>{l}</Text>
      ))}
    </View>
  ) : null;

  let body: React.ReactNode;
  if (design.template === "sidebjaelke") {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, flexDirection: "row" }}>
        <View style={{ width: pageW * 0.36, backgroundColor: shade(c.bg, -0.12), alignItems: "center", justifyContent: "center", padding: 6 * MM }}>
          {brand}
        </View>
        <View style={{ flex: 1, justifyContent: "center", paddingVertical: BLEED + 5 * MM, paddingHorizontal: 6 * MM, gap: 2 * MM }}>
          <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 13, color: c.text }}>{businessName}</Text>
          {tagline}
          <View style={{ marginTop: 1.5 * MM }}>{contact}</View>
        </View>
      </View>
    );
  } else if (design.template === "split") {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, flexDirection: "column", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "column", gap: 2 * MM, alignItems: "flex-start" }}>
          {brand}
          {tagline}
        </View>
        {contact}
      </View>
    );
  } else {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, flexDirection: "column", justifyContent: "center", alignItems, gap: 2 * MM }}>
        {brand}
        {tagline}
        <View style={{ marginTop: 1.5 * MM, alignItems }}>{contact}</View>
      </View>
    );
  }

  return (
    <Page size={[pageW, pageH]}>
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, backgroundColor: c.bg }} />
      {body}
      {cropMarks(pageW, pageH)}
    </Page>
  );
}

// ── Bagside ───────────────────────────────────────────────────────────────
function BackPage({ props, pageW, pageH, pad }: { props: DocProps; pageW: number; pageH: number; pad: number }) {
  const { design, businessName, rewardText, stampsRequired, qr } = props;
  const c = design.back;
  const fam = (bold: boolean) => pdfFamily(design.font, bold);
  const elR = cornerRadiusMm(design.corners) * MM;
  const qrTile = (size: number) => (
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: elR, padding: 2 * MM }}>
      <QrVector matrix={qr} size={size} />
    </View>
  );

  let body: React.ReactNode;
  if (design.backContent === "stempelkort") {
    const rings = Math.min(10, Math.max(1, stampsRequired));
    const ringSize = 5.5 * MM;
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, flexDirection: "row", alignItems: "center", gap: 5 * MM }}>
        <View style={{ flex: 1, flexDirection: "column", gap: 2.4 * MM }}>
          <Text style={{ fontFamily: fam(false), fontSize: 6.5, color: c.text, opacity: 0.7, letterSpacing: 0.6 }}>{businessName.toUpperCase()}</Text>
          <Text style={{ fontFamily: fam(true), fontWeight: 700, fontSize: 12, color: c.text, lineHeight: 1.12 }}>{rewardText}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 * MM, marginTop: 1 * MM }}>
            {Array.from({ length: rings }).map((_, i) => (
              <View key={i} style={{ width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderWidth: 0.7, borderColor: c.text, opacity: 0.55 }} />
            ))}
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          {qrTile(22 * MM * design.qrScale)}
          <Text style={{ fontFamily: fam(false), fontSize: 6.5, color: c.text, opacity: 0.82, marginTop: 1.6 * MM, textAlign: "center", maxWidth: 24 * MM }}>Scan og hent kortet</Text>
        </View>
      </View>
    );
  } else {
    body = (
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, padding: pad, flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: fam(design.headlineBold), fontWeight: design.headlineBold ? 700 : 400, fontSize: 13, color: c.text, textAlign: "center", lineHeight: 1.18 }}>
          {design.backHeadline}
          {design.backHeadlineAccent.trim() ? (design.backHeadline.trim() ? " " : "") : ""}
          {design.backHeadlineAccent.trim() ? <Text style={{ color: c.accent }}>{design.backHeadlineAccent}</Text> : null}
        </Text>
        {qrTile(26 * MM * design.qrScale)}
        <View style={{ alignItems: "center", gap: 1 * MM }}>
          {design.backLine1.trim() ? (
            <Text style={{ fontFamily: fam(design.line1Bold), fontWeight: design.line1Bold ? 700 : 400, fontSize: 9, color: c.text, textAlign: "center" }}>{design.backLine1}</Text>
          ) : null}
          {design.backLine2.trim() ? (
            <Text style={{ fontFamily: fam(design.line2Bold), fontWeight: design.line2Bold ? 700 : 400, fontSize: 7.5, color: c.text, opacity: 0.7, textAlign: "center" }}>{design.backLine2}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <Page size={[pageW, pageH]}>
      <View style={{ position: "absolute", top: 0, left: 0, width: pageW, height: pageH, backgroundColor: c.bg }} />
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
