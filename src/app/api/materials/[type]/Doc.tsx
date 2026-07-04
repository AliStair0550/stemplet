import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export function MaterialsPdf({
  businessName,
  qrDataUrl,
  rewardText,
  logoUrl,
  size,
}: {
  businessName: string;
  qrDataUrl: string;
  rewardText: string;
  logoUrl: string | null;
  size: "A4" | "A6";
}) {
  const poster = size === "A4";
  const styles = StyleSheet.create({
    page: {
      backgroundColor: "#FAF8F4",
      color: "#1A1A1A",
      paddingVertical: poster ? 90 : 34,
      paddingHorizontal: poster ? 70 : 28,
      fontFamily: "Helvetica",
    },
    inner: { alignItems: "center", textAlign: "center" },
    logo: {
      width: poster ? 90 : 46,
      height: poster ? 90 : 46,
      objectFit: "contain",
      marginBottom: poster ? 24 : 12,
    },
    brand: {
      fontSize: poster ? 22 : 13,
      color: "#4A4A4A",
      marginBottom: poster ? 18 : 8,
      letterSpacing: 1,
    },
    head: {
      fontSize: poster ? 40 : 20,
      marginBottom: poster ? 40 : 18,
      lineHeight: 1.2,
    },
    qr: {
      width: poster ? 300 : 150,
      height: poster ? 300 : 150,
      marginBottom: poster ? 34 : 16,
    },
    reward: {
      fontSize: poster ? 20 : 12,
      color: "#2D5F4A",
      marginBottom: poster ? 30 : 14,
    },
    foot: {
      fontSize: poster ? 12 : 8,
      color: "#6B7B75",
      letterSpacing: 0.5,
    },
  });

  return (
    <Document>
      <Page size={size} style={styles.page}>
        <View style={styles.inner}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <Text style={styles.brand}>{businessName}</Text>
          <Text style={styles.head}>Scan og faa dit stempelkort</Text>
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
