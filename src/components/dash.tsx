import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 border-b border-fog pb-5">
      <div className="min-w-0">
        <h1 className="font-[300] text-heading tracking-[0.01em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-xl font-[300] text-[0.88rem] leading-relaxed text-stone">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// Sektions-overskrift med en lille terracotta-kant, saa dashboardet faar en
// tydelig, ensartet struktur i stedet for at flyde sammen.
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-4",
        className,
      )}
    >
      <h2 className="flex items-center gap-2.5 text-title font-[400] tracking-[0.01em] text-ink">
        <span
          aria-hidden
          className="h-[1.05rem] w-[3px] shrink-0 rounded-full bg-terracotta"
        />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-fog bg-white p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-fog bg-gradient-to-b from-white to-sand/40 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-label font-[400] uppercase tracking-[0.14em] text-stone">
          {label}
        </div>
        {icon ? (
          <span className="text-terracotta/60 transition-colors group-hover:text-terracotta">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 font-[300] text-[2rem] leading-none text-ink tabular-nums">
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-[0.72rem] font-[300] text-stone">{sub}</div>
      ) : null}
    </div>
  );
}
