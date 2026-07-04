// Simpel soejlegraf i moss. Ren CSS, server-safe.
export function BarChart({
  data,
  className,
}: {
  data: { label: string; count: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className={className}>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t bg-moss/85"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.62rem] font-[200] text-slate">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
