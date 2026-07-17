"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { approveProAgreement } from "./actions";

export function ApproveButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <CtaGlow className="w-full sm:w-auto">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await approveProAgreement();
            router.refresh();
          })
        }
        className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} w-full sm:w-auto disabled:opacity-50`}
      >
        {pending ? "Godkender..." : "Godkend Pro-aftale"}
      </button>
    </CtaGlow>
  );
}
