import type { Metadata } from "next";

// Henvisninger som egen "app" paa hjemmeskaermen: eget manifest (starter paa
// arbejdslisten), eget navn og det sorte flueben-ikon paa iPhone.
export const metadata: Metadata = {
  manifest: "/henvisninger-manifest",
  appleWebApp: { capable: true, title: "Henvisninger", statusBarStyle: "default" },
  icons: { apple: "/henvisninger-apple-touch-icon.png" },
};

export default function HenvisningerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
