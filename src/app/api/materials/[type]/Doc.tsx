import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export type MaterialTier = "lg" | "md" | "sm" | "xs";

type PageSize = "A4" | "A5" | "A6" | [number, number];

// Federe, universel skrift (indbygget bold) til navn, overskrift, beloenning og
// tagline, saa materialet er tydeligt og spaendende men virker overalt.
const BOLD = "Helvetica-Bold";

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
    reward: number;
    rewardMb: number;
    foot: number;
  }
> = {
  lg: { padV: 90, padH: 70, logo: 90, logoMb: 24, brand: 22, brandMb: 18, head: 40, headMb: 40, qr: 300, qrMb: 34, reward: 20, rewardMb: 28, foot: 12 },
  md: { padV: 58, padH: 46, logo: 64, logoMb: 18, brand: 16, brandMb: 12, head: 28, headMb: 26, qr: 208, qrMb: 24, reward: 15, rewardMb: 20, foot: 10 },
  sm: { padV: 34, padH: 28, logo: 46, logoMb: 12, brand: 13, brandMb: 8, head: 20, headMb: 18, qr: 150, qrMb: 16, reward: 12, rewardMb: 14, foot: 8 },
};

export function MaterialsPdf({
  businessName,
  qrDataUrl,
  rewardText,
  logoUrl,
  pageSize,
  tier,
}: {
  businessName: string;
  qrDataUrl: string;
  rewardText: string;
  logoUrl: string | null;
  pageSize: PageSize;
  tier: MaterialTier;
}) {
  // Visitkort: vandret layout, QR til venstre og tekst til hoejre. Kompakt og
  // wrap={false}, saa det aldrig floder over den lille faste side (det fik
  // render-motoren til at haenge).
  if (tier === "xs") {
    const s = StyleSheet.create({
      page: {
        backgroundColor: "#FAF8F4",
        color: "#1A1A1A",
        padding: 16,
        fontFamily: "Helvetica",
        flexDirection: "row",
        alignItems: "center",
      },
      qr: { width: 104, height: 104, marginRight: 14 },
      right: { flex: 1 },
      brand: { fontFamily: BOLD, fontSize: 12, marginBottom: 3, letterSpacing: 0.4 },
      head: { fontFamily: BOLD, fontSize: 12.5, marginBottom: 5, lineHeight: 1.15 },
      reward: { fontFamily: BOLD, fontSize: 10, color: "#2D5F4A", marginBottom: 5 },
      foot: { fontFamily: BOLD, fontSize: 7, color: "#6B7B75" },
    });
    return (
      <Document>
        <Page size={pageSize} style={s.page} wrap={false}>
          <Image src={qrDataUrl} style={s.qr} />
          <View style={s.right}>
            <Text style={s.brand}>{businessName}</Text>
            <Text style={s.head}>Scan og få dit stempelkort</Text>
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
      backgroundColor: "#FAF8F4",
      color: "#1A1A1A",
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
    },
    head: {
      fontFamily: BOLD,
      fontSize: t.head,
      marginBottom: t.headMb,
      lineHeight: 1.2,
    },
    qr: { width: t.qr, height: t.qr, marginBottom: t.qrMb },
    reward: {
      fontFamily: BOLD,
      fontSize: t.reward,
      color: "#2D5F4A",
      marginBottom: t.rewardMb,
    },
    foot: {
      fontFamily: BOLD,
      fontSize: t.foot,
      color: "#6B7B75",
      letterSpacing: 0.5,
    },
  });

  return (
    <Document>
      <Page size={pageSize} style={styles.page} wrap={false}>
        <View style={styles.inner}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={styles.brand}>{businessName}</Text>
          <Text style={styles.head}>Scan og få dit stempelkort</Text>
          <Image src={qrDataUrl} style={styles.qr} />
          {rewardText ? <Text style={styles.reward}>{rewardText}</Text> : null}
          <Text style={styles.foot}>Ingen app. Ingen tilmelding.</Text>
        </View>
      </Page>
    </Document>
  );
}
