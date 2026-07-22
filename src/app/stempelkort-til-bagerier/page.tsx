import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { BAGERIER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(BAGERIER);

export default function Page() {
  return <BranchePage b={BAGERIER} />;
}
