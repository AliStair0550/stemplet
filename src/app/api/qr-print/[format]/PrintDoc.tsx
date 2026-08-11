import { Document, Page, View, Text, Image, Svg, Rect } from "@react-pdf/renderer";
import type { QrFormat, QrOrient } from "@/lib/qr-print";
import { QR_PRINT_BRAND } from "@/lib/qr-print";

// Fonten "Instrument Sans" registreres i route.ts (samme react-pdf-instans som
// renderToBuffer), saa den altid er indlejret i PDF'en.
export const FONT = "Instrument Sans";

const MM = 72 / 25.4;
const BLEED = 3 * MM; // 3 mm beskaering paa visitkortet

export type QrMatrix = { size: number; data: Uint8Array | number[] };

type DocProps = {
  format: QrFormat;
  orientation: QrOrient;
  businessName: string;
  headline: string;
  helper: string;
  logoUrl: string | null;
  primaryColor: string;
  textColor: string;
  qr: QrMatrix;
};

// VIGTIGT om layout: siden faar sine maal fra `size`. Alt indhold ligger i EN
// absolut, side-stor container (og evt. absolutte skaeremaerker), saa siden ikke
// har noget "flow"-indhold. Ellers udleder react-pdf hoejden af indholdet og kan
// finde paa at lave en ekstra, tom side (afproevet). Inde i den faste container
// bruger vi almindeligt flexbox.

// QR som VEKTOR: hvert moerkt modul tegnes som en rektangel, vandrette naboer
// slaas sammen til eet run, saa koden forbliver knivskarp i enhver stoerrelse og
// printer rent i sort-hvid. Altid moerk paa hvid, saa kontrasten (og dermed
// scanbarheden) aldrig afhaenger af butikkens farver.
function QrVector({ matrix, size }: { matrix: QrMatrix; size: number }) {
  const n = matrix.size;
  const data = matrix.data;
  const cell = size / n;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    let runStart = -1;
    for (let c = 0; c <= n; c++) {
      const dark = c < n && !!data[r * n + c];
      if (dark && runStart < 0) runStart = c;
      if (!dark && runStart >= 0) {
        rects.push(
          <Rect
            key={`${r}-${runStart}`}
            x={runStart * cell}
            y={r * cell}
            width={(c - runStart) * cell}
            height={cell}
            fill="#111111"
          />,
        );
        runStart = -1;
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

// Skaeremaerker: to tynde streger i beskaerings-zonen ved hvert trim-hjoerne.
// Flade, absolutte Views (ingen flow-wrappere), saa siden beholder sit maal.
function cropMarks(pageW: number, pageH: number, inset: number) {
  const L = BLEED;
  const w = 0.5;
  const black = "#000000";
  const corners = [
    { x: inset, y: inset, sx: -1, sy: -1 },
    { x: pageW - inset, y: inset, sx: 1, sy: -1 },
    { x: inset, y: pageH - inset, sx: -1, sy: 1 },
    { x: pageW - inset, y: pageH - inset, sx: 1, sy: 1 },
  ];
  const bars: React.ReactNode[] = [];
  corners.forEach((c, i) => {
    bars.push(
      <View
        key={`h${i}`}
        style={{
          position: "absolute",
          top: c.y - w / 2,
          left: c.sx < 0 ? c.x - L : c.x,
          width: L,
          height: w,
          backgroundColor: black,
        }}
      />,
    );
    bars.push(
      <View
        key={`v${i}`}
        style={{
          position: "absolute",
          left: c.x - w / 2,
          top: c.sy < 0 ? c.y - L : c.y,
          width: w,
          height: L,
          backgroundColor: black,
        }}
      />,
    );
  });
  return bars;
}

// Afsender: logo hvis der er et, ellers butikkens navn som tekst.
function Brandmark({
  logoUrl,
  businessName,
  color,
  logoH,
  nameSize,
}: {
  logoUrl: string | null;
  businessName: string;
  color: string;
  logoH: number;
  nameSize: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        style={{ height: logoH, maxWidth: logoH * 4, objectFit: "contain" }}
      />
    );
  }
  return (
    <Text style={{ fontFamily: FONT, fontWeight: 700, fontSize: nameSize, color }}>
      {businessName}
    </Text>
  );
}

// ── Visitkort: 85 x 55 mm (+ 3 mm bleed + skaeremaerker) ───────────────────
function VisitkortDoc(props: DocProps) {
  const { orientation, primaryColor, textColor, logoUrl, businessName } = props;
  const land = orientation === "landscape";
  const trimW = (land ? 85 : 55) * MM;
  const trimH = (land ? 55 : 85) * MM;
  const pageW = trimW + BLEED * 2;
  const pageH = trimH + BLEED * 2;
  const safe = 4.5 * MM;
  const pad = 2.4 * MM;
  const inner = (land ? trimH : trimW) - safe * 2;
  const qrSide = Math.min(inner - pad * 2, 34 * MM);

  return (
    <Document>
      <Page size={[pageW, pageH]}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: pageW,
            height: pageH,
            backgroundColor: primaryColor,
            paddingVertical: BLEED + safe,
            paddingHorizontal: BLEED + safe,
            flexDirection: land ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
          }}
        >
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 5, padding: pad }}>
            <QrVector matrix={props.qr} size={qrSide} />
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              marginLeft: land ? 5 * MM : 0,
              marginTop: land ? 0 : 4 * MM,
              alignItems: land ? "flex-start" : "center",
            }}
          >
            <Brandmark
              logoUrl={logoUrl}
              businessName={businessName}
              color={textColor}
              logoH={9 * MM}
              nameSize={9}
            />
            <Text
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 12,
                lineHeight: 1.15,
                color: textColor,
                marginTop: 3 * MM,
                textAlign: land ? "left" : "center",
              }}
            >
              {props.headline}
            </Text>
            <Text
              style={{
                fontFamily: FONT,
                fontSize: 7.5,
                color: textColor,
                opacity: 0.82,
                marginTop: 2 * MM,
                textAlign: land ? "left" : "center",
              }}
            >
              {props.helper}
            </Text>
            <Text
              style={{
                fontFamily: FONT,
                fontSize: 6.5,
                color: textColor,
                opacity: 0.6,
                marginTop: 3 * MM,
              }}
            >
              {QR_PRINT_BRAND}
            </Text>
          </View>
        </View>
        {cropMarks(pageW, pageH, BLEED)}
      </Page>
    </Document>
  );
}

// ── A4-plakat ─────────────────────────────────────────────────────────────
function PosterDoc(props: DocProps) {
  const { orientation, primaryColor, textColor, logoUrl, businessName } = props;
  const portrait = orientation !== "landscape";
  const A4_SHORT = 210 * MM;
  const A4_LONG = 297 * MM;
  const pageW = portrait ? A4_SHORT : A4_LONG;
  const pageH = portrait ? A4_LONG : A4_SHORT;
  const qrSide = (portrait ? 92 : 78) * MM;

  return (
    <Document>
      <Page size={[pageW, pageH]}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: pageW,
            height: pageH,
            backgroundColor: primaryColor,
            padding: 20 * MM,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
          }}
        >
          <View style={{ alignItems: "center", maxWidth: portrait ? 480 : 620 }}>
            <Brandmark
              logoUrl={logoUrl}
              businessName={businessName}
              color={textColor}
              logoH={22 * MM}
              nameSize={20}
            />
            <Text
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: portrait ? 30 : 26,
                lineHeight: 1.12,
                color: textColor,
                textAlign: "center",
                marginTop: 7 * MM,
              }}
            >
              {props.headline}
            </Text>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: 5 * MM,
                marginTop: 8 * MM,
              }}
            >
              <QrVector matrix={props.qr} size={qrSide} />
            </View>
            <Text
              style={{
                fontFamily: FONT,
                fontSize: portrait ? 15 : 13,
                color: textColor,
                opacity: 0.9,
                textAlign: "center",
                marginTop: 8 * MM,
              }}
            >
              {props.helper}
            </Text>
            <Text
              style={{
                fontFamily: FONT,
                fontSize: 11,
                color: textColor,
                opacity: 0.6,
                marginTop: 6 * MM,
              }}
            >
              {QR_PRINT_BRAND}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function QrPrintDoc(props: DocProps) {
  return props.format === "visitkort" ? (
    <VisitkortDoc {...props} />
  ) : (
    <PosterDoc {...props} />
  );
}
