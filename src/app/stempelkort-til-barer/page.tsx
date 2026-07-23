import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { BARER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(BARER);

export default function Page() {
  return <BranchePage b={BARER} />;
}
