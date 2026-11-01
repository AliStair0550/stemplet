import { brancheOgImage, OG_SIZE } from "@/lib/branche-og";
import { KAFFEBARER } from "@/lib/brancher";

// Sidens eget delebillede: branchens navn og eksempelkort.
export const runtime = "nodejs";
export const alt = KAFFEBARER.eyebrow;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brancheOgImage(KAFFEBARER);
}
