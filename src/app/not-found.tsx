import Link from "next/link";
import { btnClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 bg-parchment px-6 text-center">
      <span className="font-fraunces text-[4rem] font-light italic leading-none text-moss">
        404
      </span>
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="font-[300] text-[1.6rem] tracking-[0.01em] text-ink">
          Siden findes ikke
        </h1>
        <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
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
