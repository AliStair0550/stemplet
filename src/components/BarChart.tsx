// Enkelt-serie soejlegraf: terracotta med fin diagonal tekstur. Vaerdien staar
// paa EN fast linje lige over soejlerne (samme hoejde for alle), saa tallene er
// nemme at scanne uafhaengigt af soejlehoejden. Kan vise en fast etiket (fx
// ugedag eller maaned) under hver soejle. Ren CSS, vokser blidt ved indlaesning
// (reduceret bevaegelse respekteres globalt).
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
      <div className="flex h-44 items-stretch gap-2 sm:gap-2.5">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center">
              {/* Tal-raekke: samme linje for alle soejler, lige over dem. */}
              <span
                className={`mb-1.5 text-[0.66rem] tabular-nums ${
                  i === maxIdx && d.count > 0
                    ? "font-[500] text-ink"
                    : "font-[300] text-slate"
                }`}
              >
                {d.count}
              </span>
              {/* Soejle-omraade fylder resten; soejlen vokser fra baseline. */}
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[44px] origin-bottom rounded-t-[5px]"
                  style={{
                    height: `${Math.max(1.5, h)}%`,
                    background:
                      "repeating-linear-gradient(135deg, #A6502E 0 5px, #8F432695 5px 6px)",
                    animation: "growBar 0.7s cubic-bezier(0.16,1,0.3,1) both",
                    animationDelay: `${i * 0.03}s`,
                  }}
                />
              </div>
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
