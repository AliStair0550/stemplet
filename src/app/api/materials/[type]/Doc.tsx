import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Fonten "Instrument Sans" registreres i route.ts (samme react-pdf-instans som
// renderToBuffer), saa den altid er indlejret i PDF'en.
export const FONT = "Instrument Sans";

export type MaterialTier = "lg" | "md" | "sm" | "xs";

type PageSize = "A4" | "A5" | "A6" | "A7" | [number, number];

// Subtil kant om QR-feltet, saa det ogsaa staar tydeligt paa lyse kortfarver.
const TILE_BORDER = "#00000014";

// Lodrette skilte (A4/A5/A6): samme opbygning, skaleret pr. stoerrelse.
const TIERS: Record<
  "lg" | "md" | "sm",
  {
    padV: number;
    padH: number;
    brandMb: number;
    logo: number;
    head: number;
    headMb: number;
    grid: number; // bredde paa stempel-gitteret (0 = skjul)
    gridMb: number;
    qr: number;
    qrMb: number;
    tilePad: number;
    tileR: number;
    reward: number;
    rewardMb: number;
    foot: number;
  }
> = {
  lg: { padV: 74, padH: 60, brandMb: 20, logo: 74, head: 34, headMb: 26, grid: 300, gridMb: 26, qr: 250, qrMb: 22, tilePad: 18, tileR: 16, reward: 19, rewardMb: 22, foot: 12 },
  md: { padV: 48, padH: 40, brandMb: 14, logo: 54, head: 25, headMb: 18, grid: 220, gridMb: 20, qr: 184, qrMb: 16, tilePad: 14, tileR: 12, reward: 15, rewardMb: 16, foot: 10 },
  sm: { padV: 28, padH: 24, brandMb: 9, logo: 40, head: 18, headMb: 12, grid: 0, gridMb: 0, qr: 138, qrMb: 12, tilePad: 10, tileR: 9, reward: 12, rewardMb: 11, foot: 8 },
};

export function MaterialsPdf({
  businessName,
  qrDataUrl,
  rewardText,
  logoUrl,
  pageSize,
  tier,
  primaryColor,
  textColor,
  // Standard: uden navn/logo. Butikker skriver ofte navnet med egen font eller
  // har et specielt logo, saa materialet er rent brandet paa farver + stempler.
  showBrand,
  // Transparent PNG af det tomme stempel-gitter (samme ikoner som kortet).
  stampGrid,
  stampAspect,
}: {
  businessName: string;
  qrDataUrl: string;
  rewardText: string;
  logoUrl: string | null;
  pageSize: PageSize;
  tier: MaterialTier;
  primaryColor: string;
  textColor: string;
  showBrand: boolean;
  stampGrid: string | null;
  stampAspect: number;
}) {
  const bg = primaryColor;
  const fg = textColor;

  const brand =
    showBrand && logoUrl ? (
      <Image src={logoUrl} style={{ maxWidth: 160, objectFit: "contain" }} />
    ) : showBrand && businessName ? (
      <Text style={{ fontFamily: FONT, fontWeight: 700, color: fg }}>
        {businessName}
      </Text>
    ) : null;

  // Visitkort: A7 i landskab (navngivet stoerrelse, saa render-motoren ikke
  // haenger som ved en custom tuple-stoerrelse). QR til venstre, tekst til hoejre.
  if (tier === "xs") {
    const s = StyleSheet.create({
      page: { backgroundColor: bg, color: fg, padding: 20, fontFamily: FONT, flexDirection: "row", alignItems: "center" },
      tile: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 9, marginRight: 16, borderWidth: 1, borderColor: TILE_BORDER },
      qr: { width: 104, height: 104 },
      right: { width: 128 },
      brand: { fontSize: 12, fontWeight: 700, marginBottom: 5, color: fg },
      head: { fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: fg },
      reward: { fontSize: 10.5, fontWeight: 700, color: fg, marginBottom: 8 },
      foot: { fontSize: 7.5, color: fg, opacity: 0.72 },
    });
    return (
      <Document>
        <Page size={pageSize} orientation="landscape" style={s.page}>
          <View style={s.tile}>
            <Image src={qrDataUrl} style={s.qr} />
          </View>
          <View style={s.right}>
            {showBrand && businessName ? <Text style={s.brand}>{businessName}</Text> : null}
            <Text style={s.head}>Scan og få dit{"\n"}Stempelkort</Text>
            {rewardText ? <Text style={s.reward}>{rewardText}</Text> : null}
            <Text style={s.foot}>Ingen app. Ingen tilmelding.</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const t = TIERS[tier];
  const showGrid = t.grid > 0 && !!stampGrid;
  const styles = StyleSheet.create({
    page: { backgroundColor: bg, color: fg, paddingVertical: t.padV, paddingHorizontal: t.padH, fontFamily: FONT },
    inner: { alignItems: "center", textAlign: "center" },
    brand: { marginBottom: t.brandMb, alignItems: "center" },
    head: { fontSize: t.head, fontWeight: 700, marginBottom: t.headMb, lineHeight: 1.15, color: fg },
    grid: { width: t.grid, height: t.grid / stampAspect, marginBottom: t.gridMb },
    tile: { backgroundColor: "#FFFFFF", borderRadius: t.tileR, padding: t.tilePad, marginBottom: t.qrMb, borderWidth: 1, borderColor: TILE_BORDER },
    qr: { width: t.qr, height: t.qr },
    reward: { fontSize: t.reward, fontWeight: 700, color: fg, marginBottom: t.rewardMb },
    foot: { fontSize: t.foot, color: fg, opacity: 0.72 },
  });

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap={false}>
        <View style={styles.inner}>
          {brand ? <View style={styles.brand}>{brand}</View> : null}
          <Text style={styles.head}>Scan og få dit{"\n"}Stempelkort</Text>
          {showGrid ? <Image src={stampGrid as string} style={styles.grid} /> : null}
          {rewardText ? <Text style={styles.reward}>{rewardText}</Text> : null}
          <View style={styles.tile}>
            <Image src={qrDataUrl} style={styles.qr} />
          </View>
          <Text style={styles.foot}>Ingen app. Ingen tilmelding.</Text>
        </View>
      </Page>
    </Document>
  );
}
