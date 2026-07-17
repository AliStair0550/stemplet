import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Knapper (helt runde pills, normal case, een accent: terracotta) ────

type Variant = "primary" | "ink" | "outline" | "moss" | "ghost" | "light";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // DEN CTA: rust. Brugt sparsomt.
  primary: "bg-terracotta text-parchment hover:bg-terracotta-dark",
  // Staerk, neutral handling paa lys flade.
  ink: "bg-ink text-parchment hover:bg-ink/90",
  // Sekundaer: haarfin border, ingen skygge.
  outline: "border border-ink/15 text-ink hover:border-ink/30 hover:bg-ink/[0.03]",
  // Bevaret til dashboard/admin (fase 2).
  moss: "bg-moss text-parchment hover:bg-moss-light",
  ghost: "text-taupe hover:text-ink",
  // Lys knap til moerke sektioner (#1C1917-baggrund).
  light: "bg-parchment text-ink hover:bg-sand",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-6 py-2.5 text-[0.9rem]",
  lg: "min-h-[3.25rem] px-8 py-3.5 text-[0.95rem]",
};

export function btnClass(variant: Variant = "primary", size: Size = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
    // Synlig tastatur-fokus overalt (terracotta-ring).
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
    VARIANTS[variant],
    SIZES[size],
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={cn(btnClass(variant, size), className)} {...rest}>
      {children}
    </Link>
  );
}

// ── CTA-fremhaevning ──────────────────────────────────────────────────

// Ekstra klasser paa en primaer CTA, saa den faar pill-form + bloedt loeft
// (bruges sammen med <CtaGlow> for at drage oejet til "tryk her").
export const CTA_EMPHASIS = "relative w-full rounded-full shadow-lift";

/** BlOd, pulserende glOd bag en primaer CTA. Pak knappen/anchoren ind. */
export function CtaGlow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full bg-terracotta/25 blur-md animate-cta-glow"
      />
      {children}
    </div>
  );
}

/** Kort/wallet-ikon til "Laeg i Apple Wallet"-CTA'er. */
export function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[1.1rem] w-[1.1rem]", className)}
      aria-hidden
    >
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <path d="M16 14.5h2" />
    </svg>
  );
}

// ── Layout-primitiver ─────────────────────────────────────────────────

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1120px] px-6 md:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    // overflow-x-clip: dekorative gloed (-inset/-right blur) maa aldrig goere
    // sektionen bredere end skaermen. Klipper hver sektion ved kilden, saa
    // "zoom-ud ved traek" ikke kan opstaa uanset hvilken sektion det er.
    <section id={id} className={cn("py-20 md:py-24 overflow-x-clip", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-label font-medium uppercase tracking-[0.08em] text-taupe-light",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto h-px max-w-[1120px] bg-ink/[0.08]", className)} />
  );
}
