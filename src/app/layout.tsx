import type { Metadata, Viewport } from "next";
import { Jost, Fraunces } from "next/font/google";
import "./globals.css";

// Selv-hostede fonts (next/font): ingen render-blokerende eksterne
// forbindelser, automatisk preload og font-display: swap. Begge er variable
// fonts, saa alle vaegte daekkes af én fil pr. familie.
const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces-face",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Stemplet - det digitale stempelkort",
    template: "%s - Stemplet",
  },
  description:
    "Dine kunder scanner en QR-kode og har dit stempelkort i Apple Wallet på fem sekunder. Ingen app. Ingen tilmelding. Et produkt fra Alius.",
  applicationName: "Stemplet",
  keywords: [
    "stempelkort",
    "digitalt stempelkort",
    "loyalitetskort",
    "kundeklub",
    "Apple Wallet",
    "loyalitetsprogram",
    "genbesøg",
    "café loyalitet",
    "Stemplet",
    "Alius",
  ],
  authors: [{ name: "Alius", url: "https://alius.dk" }],
  creator: "Alius",
  appleWebApp: {
    capable: true,
    title: "Stemplet",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Stemplet - stempelkortet, der skaber flere gensyn",
    description:
      "Digitalt stempelkort i Apple Wallet. Ingen app, ingen tilmelding. Et produkt fra Alius.",
    url: appUrl,
    siteName: "Stemplet",
    locale: "da_DK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stemplet - stempelkortet, der skaber flere gensyn",
    description:
      "Digitalt stempelkort i Apple Wallet. Ingen app, ingen tilmelding.",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
  // Siden er lys-only. Uden dette viser iOS Safari en SORT baggrund, mens den
  // render-blokerende CSS hentes (paa telefoner i moerk tilstand), saa foerste
  // billede er sort i et par sekunder. Med color-scheme: light bruger browseren
  // en lys baggrund fra foerste frame (meta'et staar i HTML foer CSS'en).
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className={`${jost.variable} ${fraunces.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
