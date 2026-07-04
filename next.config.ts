import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pakker der bruger Node-native ting (fs, node-forge, streams) og ikke skal
  // bundles af Turbopack. Wallet og PDF koerer kun server-side.
  serverExternalPackages: ["passkit-generator", "@react-pdf/renderer"],
  experimental: {
    // Logo-upload via server action kan vaere op til et par MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
};

export default nextConfig;
