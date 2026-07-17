"use client";

import { useFormStatus } from "react-dom";
import { btnClass } from "./ui";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText = "Et øjeblik...",
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "outline" | "terracotta" | "ghost";
  size?: "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(btnClass(variant, size), className)}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Lille roterende ring til loading-tilstande. Bruger currentColor. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
