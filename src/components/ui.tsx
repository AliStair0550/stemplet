import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Knapper (Alius-stil: skarpe hjørner, uppercase, wide tracking) ────

type Variant = "primary" | "outline" | "moss" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-parchment border border-ink hover:bg-moss hover:border-moss",
  outline: "border border-clay text-ink hover:border-moss hover:text-moss",
  moss: "bg-moss text-parchment border border-moss hover:bg-moss-light hover:border-moss-light",
  ghost: "text-slate hover:text-ink",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-7 py-3",
  lg: "min-h-12 px-9 py-3.5",
};

export function btnClass(variant: Variant = "primary", size: Size = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-2 font-[300] text-[0.82rem] tracking-[0.08em] uppercase transition-all disabled:opacity-50 disabled:pointer-events-none",
    // Synlig tastatur-fokus overalt (samme ring paa alle knapper).
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
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

// ── Layout-primitiver ─────────────────────────────────────────────────

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1100px] px-6 md:px-8", className)}>
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
    <section id={id} className={cn("py-20 md:py-28", className)}>
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
        "text-label font-[400] uppercase tracking-[0.12em] text-moss",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("mx-auto h-px max-w-[1100px] bg-clay", className)} />;
}
