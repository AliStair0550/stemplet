"use client";

import { btnClass } from "@/components/ui";

// Aabner browserens print-dialog. Print-versionen styres af @media print i
// globals.css (A4, sort/hvid, uden menu og knapper).
export function PrintGuideButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={btnClass("outline") + " print:hidden"}
    >
      Print guide
    </button>
  );
}
