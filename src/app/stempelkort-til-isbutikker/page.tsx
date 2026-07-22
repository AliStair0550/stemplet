import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { ISBUTIKKER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(ISBUTIKKER);

export default function Page() {
  return <BranchePage b={ISBUTIKKER} />;
}
