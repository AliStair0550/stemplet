import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { BLOMSTERBUTIKKER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(BLOMSTERBUTIKKER);

export default function Page() {
  return <BranchePage b={BLOMSTERBUTIKKER} />;
}
