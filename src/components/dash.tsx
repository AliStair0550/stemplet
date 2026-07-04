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
        <h1 className="font-[300] text-[1.6rem] tracking-[0.01em] text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 font-[200] text-[0.88rem] text-stone">{subtitle}</p>
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
    <div className={cn("rounded-sm border border-fog bg-white p-6", className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-sm border border-fog bg-white p-5", className)}>
      <div className="text-[0.62rem] font-[400] uppercase tracking-[0.14em] text-slate">
        {label}
      </div>
      <div className="mt-2 font-[300] text-[1.9rem] tabular-nums leading-none text-ink">
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-[0.72rem] font-[200] text-slate">{sub}</div>
      ) : null}
    </div>
  );
}
