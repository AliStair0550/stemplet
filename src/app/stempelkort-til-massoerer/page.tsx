import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { MASSOERER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(MASSOERER);

export default function Page() {
  return <BranchePage b={MASSOERER} />;
}
