import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { NEGLESALONER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(NEGLESALONER);

export default function Page() {
  return <BranchePage b={NEGLESALONER} />;
}
