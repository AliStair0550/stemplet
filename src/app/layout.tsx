import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
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
    <html lang="da">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@100;200;300;400;500&family=Fraunces:ital,wght@0,200;0,300;0,400;1,200;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
