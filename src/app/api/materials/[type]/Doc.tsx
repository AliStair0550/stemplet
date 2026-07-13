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
  // Visitkort: vandret layout med QR til venstre og teksten til hoejre.
  if (tier === "xs") {
    const s = StyleSheet.create({
      page: {
        backgroundColor: "#FAF8F4",
        color: "#1A1A1A",
        padding: 14,
        fontFamily: "Helvetica",
        flexDirection: "row",
        alignItems: "center",
      },
      qr: { width: 118, height: 118, marginRight: 14 },
      right: { flex: 1 },
      logo: { width: 40, height: 40, objectFit: "contain", marginBottom: 6 },
      brand: { fontSize: 12, color: "#4A4A4A", marginBottom: 4, letterSpacing: 0.5 },
      head: { fontSize: 14, marginBottom: 6, lineHeight: 1.2 },
      reward: { fontSize: 10, color: "#2D5F4A", marginBottom: 6 },
      foot: { fontSize: 7, color: "#6B7B75" },
    });
    return (
      <Document>
        <Page size={pageSize} style={s.page}>
          <Image src={qrDataUrl} style={s.qr} />
          <View style={s.right}>
            {logoUrl ? <Image src={logoUrl} style={s.logo} /> : null}
            <Text style={s.brand}>{businessName}</Text>
            <Text style={s.head}>Scan og få dit stempelkort</Text>
            {rewardText ? <Text style={s.reward}>{rewardText}</Text> : null}
            <Text style={s.foot}>
              Ingen app. Ingen tilmelding. Drevet af Stemplet.
            </Text>
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
      fontSize: t.brand,
      color: "#4A4A4A",
      marginBottom: t.brandMb,
      letterSpacing: 1,
    },
    head: { fontSize: t.head, marginBottom: t.headMb, lineHeight: 1.2 },
    qr: { width: t.qr, height: t.qr, marginBottom: t.qrMb },
    reward: { fontSize: t.reward, color: "#2D5F4A", marginBottom: t.rewardMb },
    foot: { fontSize: t.foot, color: "#6B7B75", letterSpacing: 0.5 },
  });

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        <View style={styles.inner}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={styles.brand}>{businessName}</Text>
          <Text style={styles.head}>Scan og få dit stempelkort</Text>
          <Image src={qrDataUrl} style={styles.qr} />
          {rewardText ? <Text style={styles.reward}>{rewardText}</Text> : null}
          <Text style={styles.foot}>
            Ingen app. Ingen tilmelding. Drevet af Stemplet.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
