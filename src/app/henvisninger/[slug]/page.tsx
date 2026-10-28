import { permanentRedirect } from "next/navigation";

// Een butiksside: henvisningerne bor nu paa /k/[slug] sammen med kortet. Gamle
// links (QR, Wallet-kort, delte venne-links med ?k=KODE) sendes videre med koden.
export default async function ReferralRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; via?: string }>;
}) {
  const { slug } = await params;
  const { k, via } = await searchParams;
  const q = new URLSearchParams();
  if (k) q.set("k", k.slice(0, 40));
  if (via === "kode") q.set("via", "kode");
  const qs = q.toString();
  permanentRedirect(`/k/${encodeURIComponent(slug)}${qs ? `?${qs}` : `?del=1`}`);
}
