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
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-[300] text-heading tracking-[0.01em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 font-[300] text-[0.88rem] text-stone">{subtitle}</p>
        ) : null}
      </div>
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
    <div className={cn("rounded-lg border border-fog bg-white p-6", className)}>
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
        "group relative overflow-hidden rounded-lg border border-fog bg-white p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
          {label}
        </div>
        {icon ? (
          <span className="text-moss/60 transition-colors group-hover:text-moss">
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
