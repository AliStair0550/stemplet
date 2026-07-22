import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { PIZZERIAER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(PIZZERIAER);

export default function Page() {
  return <BranchePage b={PIZZERIAER} />;
}
