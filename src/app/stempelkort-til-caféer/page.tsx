import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { CAFEER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(CAFEER);

export default function Page() {
  return <BranchePage b={CAFEER} />;
}
