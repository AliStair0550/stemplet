import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { OELBARER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(OELBARER);

export default function Page() {
  return <BranchePage b={OELBARER} />;
}
