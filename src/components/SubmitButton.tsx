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
  variant?: "primary" | "outline" | "moss" | "ghost";
  size?: "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(btnClass(variant, size), className)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
