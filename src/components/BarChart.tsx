// Enkelt-serie søjlegraf: moss med fin diagonal tekstur (farve + mønster),
// 4px afrundet top ved baseline, hover-tooltip, og en direkte etiket paa
// den højeste søjle. Kan vise en fast etiket (fx ugedag) under hver søjle.
// Ren CSS - vokser blidt ved indlæsning (reduceret bevægelse respekteres).
export function BarChart({
  data,
  className,
}: {
  data: { label: string; count: number; sublabel?: string }[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const maxIdx = data.reduce(
    (mi, d, i, arr) => (d.count > arr[mi].count ? i : mi),
    0,
  );
  const hasSublabels = data.some((d) => d.sublabel);

  return (
    <div className={className}>
      <div className="flex h-44 items-end gap-2 sm:gap-2.5">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 items-end justify-center"
            >
              <div
                className="w-full max-w-[44px] origin-bottom rounded-t-[5px]"
                style={{
                  height: `${Math.max(1.5, h)}%`,
                  background:
                    "repeating-linear-gradient(135deg, #2D5F4A 0 5px, #21483795 5px 6px)",
                  animation: "growBar 0.7s cubic-bezier(0.16,1,0.3,1) both",
                  animationDelay: `${i * 0.03}s`,
                }}
              />
              {/* Vaerdi over hver soejle, saa den ogsaa er laesbar paa mobil
                  (ingen hover). Hoejeste dag fremhaeves. */}
              {d.count > 0 ? (
                <span
                  className={`absolute -top-5 text-[0.6rem] tabular-nums ${
                    i === maxIdx
                      ? "font-[400] text-ink"
                      : "font-[300] text-slate"
                  }`}
                >
                  {d.count}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="h-px w-full bg-clay" />

      {hasSublabels ? (
        <div className="mt-2 flex gap-2 sm:gap-2.5">
          {data.map((d, i) => (
            <span
              key={i}
              className="flex-1 text-center text-[0.62rem] font-[300] capitalize text-slate"
            >
              {d.sublabel}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex justify-between text-[0.62rem] font-[200] text-slate">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
}
