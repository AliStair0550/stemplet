import type { StampIconKey } from "@/lib/brand";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";

// Tynde line-art ikoner i Alius-stil. Bruger currentColor, saa foraelderen
// styrer farven (kortets tekstfarve). Stierne kommer fra den delte kilde
// (stamp-icon-paths), saa kort, Wallet-strip og hero altid viser det samme ikon.
export function StampIcon({
  icon,
  className,
}: {
  icon: StampIconKey;
  className?: string;
}) {
  const markup = STAMP_ICON_PATHS[icon] ?? STAMP_ICON_PATHS.custom;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
