"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { approveProAgreement } from "./actions";

export function ApproveButton({ quiet = false }: { quiet?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const approve = () =>
    start(async () => {
      await approveProAgreement();
      router.refresh();
    });

  // Frivillig bekraeftelse i de gratis maaneder: en stille knap.
  if (quiet) {
    return (
      <button type="button" disabled={pending} onClick={approve} className={`${btnClass("outline")} self-start disabled:opacity-50`}>
        {pending ? "Bekræfter..." : "Bekræft allerede nu"}
      </button>
    );
  }

  return (
    <CtaGlow className="w-full sm:w-auto">
      <button
        type="button"
        disabled={pending}
        onClick={approve}
        className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} w-full sm:w-auto disabled:opacity-50`}
      >
        {pending ? "Bekræfter..." : "Bekræft abonnementet"}
      </button>
    </CtaGlow>
  );
}
