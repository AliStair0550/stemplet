import Link from "next/link";
import { cn } from "@/lib/utils";

// Skift mellem Stemplets kasse og henvisninger. Vises KUN for butikker med
// henvisninger slaaet til; uden modulet renderer kassesiderne praecis som foer.
export type KasseView = "stempler" | "henvisninger";

export function kasseViewFrom(enabled: boolean, param: string | undefined): KasseView {
  return enabled && param === "henvisninger" ? "henvisninger" : "stempler";
}

export function KasseViewSwitch({ basePath, view }: { basePath: string; view: KasseView }) {
  const item = (v: KasseView, label: string) => (
    <Link
      href={v === "stempler" ? basePath : `${basePath}?visning=henvisninger`}
      aria-current={view === v ? "page" : undefined}
      className={cn(
        "rounded-full px-5 py-2 text-[0.88rem] transition-colors",
        view === v ? "bg-ink text-parchment" : "text-stone hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Kassevisning" className="mb-6 flex justify-center">
      <div className="inline-flex gap-1 rounded-full border border-fog bg-white p-1">
        {item("stempler", "Stempler")}
        {item("henvisninger", "Henvisninger")}
      </div>
    </nav>
  );
}
