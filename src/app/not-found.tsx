import Link from "next/link";
import { btnClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="dash-theme flex min-h-screen flex-col items-center justify-center gap-7 bg-parchment px-6 text-center">
      <span className="text-[4rem] font-semibold leading-none tracking-[-0.03em] text-terracotta">
        404
      </span>
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.01em] text-ink">
          Siden findes ikke
        </h1>
        <p className="max-w-xs text-[0.9rem] leading-relaxed text-stone">
          Linket er måske forældet, eller siden er flyttet. Lad os få dig
          tilbage på sporet.
        </p>
      </div>
      <Link href="/" className={btnClass("primary")}>
        Til forsiden
      </Link>
    </main>
  );
}
