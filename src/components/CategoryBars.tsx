// Kategorisk graf: hver kategori har egen farve OG eget mønster (diagonal
// tekstur), plus direkte etiket og en farveprik som legend. Identitet
// hviler aldrig paa farve alene - i tråd med tilgængelighed. Overskuelig,
// elegant og vokser blidt ved indlæsning.

type Cat = { label: string; value: number };

const STYLES = [
  { color: "#A6502E", tex: "repeating-linear-gradient(45deg,#A6502E 0 6px,#7A3A22 6px 7px)" },
  { color: "#B8923A", tex: "repeating-linear-gradient(135deg,#B8923A 0 6px,#9a7a2e 6px 7px)" },
  { color: "#6B7B75", tex: "repeating-linear-gradient(45deg,#6B7B75 0 6px,#54615c 6px 7px)" },
];

export function CategoryBars({
  data,
  className,
}: {
  data: Cat[];
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const max = Math.max(1, ...data.map((d) => d.value));

  if (total <= 1 && data.every((d) => d.value === 0)) {
    return (
      <p className="font-[200] text-[0.85rem] text-slate">
        Ingen data endnu.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        {data.map((d, i) => {
          const s = STYLES[i % STYLES.length];
          const w = (d.value / max) * 100;
          return (
            <div key={d.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="flex items-center gap-2 font-[300] text-ink">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  {d.label}
                </span>
                <span className="font-[200] tabular-nums text-slate">
                  {d.value} · {Math.round((d.value / total) * 100)}%
                </span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-lg bg-fog">
                <div
                  className="h-full origin-left rounded-lg"
                  style={{
                    width: `${Math.max(2, w)}%`,
                    background: s.tex,
                    animation: "growWidth 0.8s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
