import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-[400] text-[1.05rem] tracking-[0.01em] text-ink",
        className,
      )}
    >
      Stemplet<span className="text-moss">.</span>
    </Link>
  );
}
