"use client";

import { LazyOnView } from "./LazyOnView";

// De tunge, animerede/interaktive under-fold-klient-komponenter. Deres JavaScript
// hentes foerst, naar man scroller naer dem, saa forsidens FOERSTE load kun
// omfatter hero'en. Server-sektioner (Problem-skal, Sikkerhed, Pris osv.) SSR'es
// stadig for SEO og hurtig visning.

export function RoiCalculatorLazy() {
  return <LazyOnView load={() => import("./RoiCalculator")} minHeight={560} />;
}

export function FaqLazy() {
  return <LazyOnView load={() => import("./Faq")} minHeight={520} />;
}

export function StatsSceneLazy() {
  return (
    <LazyOnView
      load={() =>
        import("./StatsScene").then((m) => ({ default: m.StatsScene }))
      }
      minHeight={260}
    />
  );
}
