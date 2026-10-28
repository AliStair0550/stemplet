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
    <div className="mb-10 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] text-ink md:text-[2.4rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-[1rem] leading-relaxed text-stone">
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
      <h2 className="text-[1.3rem] font-bold tracking-[-0.025em] text-ink">{title}</h2>
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
        "rounded-[18px] border border-fog bg-white p-6 shadow-card",
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
        "group relative overflow-hidden rounded-[18px] border border-fog bg-white p-5 shadow-card transition-all duration-200 hover:border-clay",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[0.85rem] font-medium text-stone">
          {label}
        </div>
        {icon ? (
          <span className="text-terracotta/60 transition-colors group-hover:text-terracotta">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-[2.1rem] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums">
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-[0.72rem] font-[300] text-stone">{sub}</div>
      ) : null}
    </div>
  );
}
