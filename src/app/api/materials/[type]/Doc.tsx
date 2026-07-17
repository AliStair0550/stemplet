import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export type MaterialTier = "lg" | "md" | "sm" | "xs";

type PageSize = "A4" | "A5" | "A6" | "A7" | [number, number];

// Federe, universel skrift (indbygget bold) til navn, overskrift, beloenning og
// tagline, saa materialet er tydeligt og spaendende men virker overalt.
const BOLD = "Helvetica-Bold";

// Subtil kant om QR-feltet, saa det ogsaa staar tydeligt paa lyse kortfarver.
const TILE_BORDER = "#00000014";

// Lodrette skilte (A4/A5/A6): samme opbygning, skaleret pr. stoerrelse.
const TIERS: Record<
  "lg" | "md" | "sm",
  {
    padV: number;
    padH: number;
    logo: number;
    logoMb: number;
    brand: number;
    brandMb: number;
    head: number;
    headMb: number;
    qr: number;
    qrMb: number;
    tilePad: number;
    tileR: number;
    reward: number;
    rewardMb: number;
    foot: number;
  }
> = {
  lg: { padV: 80, padH: 64, logo: 88, logoMb: 22, brand: 22, brandMb: 16, head: 38, headMb: 34, qr: 280, qrMb: 30, tilePad: 20, tileR: 16, reward: 20, rewardMb: 24, foot: 12 },
  md: { padV: 52, padH: 42, logo: 62, logoMb: 16, brand: 16, brandMb: 11, head: 27, headMb: 22, qr: 196, qrMb: 22, tilePad: 15, tileR: 12, reward: 15, rewardMb: 18, foot: 10 },
  sm: { padV: 30, padH: 26, logo: 44, logoMb: 11, brand: 13, brandMb: 7, head: 19, headMb: 15, qr: 142, qrMb: 14, tilePad: 10, tileR: 9, reward: 12, rewardMb: 12, foot: 8 },
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
}: {
  businessName: string;
  qrDataUrl: string;
  rewardText: string;
  logoUrl: string | null;
  pageSize: PageSize;
  tier: MaterialTier;
  // Butikkens egne kortfarver, saa skiltet ligner kortet de har designet.
  primaryColor: string;
  textColor: string;
}) {
  const bg = primaryColor;
  const fg = textColor;

  // Visitkort: A7 i landskab (navngivet stoerrelse, saa render-motoren ikke
  // haenger som ved en custom tuple-stoerrelse). Vandret layout: QR til venstre,
  // tekst til hoejre med eksplicit bredde (ingen flex, robust paa den lille side).
  if (tier === "xs") {
    const s = StyleSheet.create({
      page: {
        backgroundColor: bg,
        color: fg,
        padding: 20,
        fontFamily: "Helvetica",
        flexDirection: "row",
        alignItems: "center",
      },
      tile: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 9,
        marginRight: 16,
        borderWidth: 1,
        borderColor: TILE_BORDER,
      },
      qr: { width: 104, height: 104 },
      right: { width: 128 },
      brand: { fontFamily: BOLD, fontSize: 13, marginBottom: 5, letterSpacing: 0.4, color: fg },
      head: { fontFamily: BOLD, fontSize: 14, marginBottom: 8, lineHeight: 1.15, color: fg },
      reward: { fontFamily: BOLD, fontSize: 10.5, color: fg, marginBottom: 8 },
      foot: { fontSize: 7.5, color: fg, opacity: 0.72 },
    });
    return (
      <Document>
        <Page size={pageSize} orientation="landscape" style={s.page}>
          <View style={s.tile}>
            <Image src={qrDataUrl} style={s.qr} />
          </View>
          <View style={s.right}>
            <Text style={s.brand}>{businessName}</Text>
            <Text style={s.head}>Scan og få dit{"\n"}Stempelkort</Text>
            {rewardText ? <Text style={s.reward}>{rewardText}</Text> : null}
            <Text style={s.foot}>Ingen app. Ingen tilmelding.</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const t = TIERS[tier];
  const styles = StyleSheet.create({
    page: {
      backgroundColor: bg,
      color: fg,
      paddingVertical: t.padV,
      paddingHorizontal: t.padH,
      fontFamily: "Helvetica",
    },
    inner: { alignItems: "center", textAlign: "center" },
    logo: {
      width: t.logo,
      height: t.logo,
      objectFit: "contain",
      marginBottom: t.logoMb,
    },
    brand: {
      fontFamily: BOLD,
      fontSize: t.brand,
      marginBottom: t.brandMb,
      letterSpacing: 1,
      color: fg,
    },
    head: {
      fontFamily: BOLD,
      fontSize: t.head,
      marginBottom: t.headMb,
      lineHeight: 1.2,
      color: fg,
    },
    tile: {
      backgroundColor: "#FFFFFF",
      borderRadius: t.tileR,
      padding: t.tilePad,
      marginBottom: t.qrMb,
      borderWidth: 1,
      borderColor: TILE_BORDER,
    },
    qr: { width: t.qr, height: t.qr },
    reward: {
      fontFamily: BOLD,
      fontSize: t.reward,
      color: fg,
      marginBottom: t.rewardMb,
    },
    foot: {
      fontSize: t.foot,
      color: fg,
      opacity: 0.72,
      letterSpacing: 0.5,
    },
  });

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap={false}>
        <View style={styles.inner}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={styles.brand}>{businessName}</Text>
          <Text style={styles.head}>Scan og få dit{"\n"}Stempelkort</Text>
          <View style={styles.tile}>
            <Image src={qrDataUrl} style={styles.qr} />
          </View>
          {rewardText ? <Text style={styles.reward}>{rewardText}</Text> : null}
          <Text style={styles.foot}>Ingen app. Ingen tilmelding.</Text>
        </View>
      </Page>
    </Document>
  );
}
