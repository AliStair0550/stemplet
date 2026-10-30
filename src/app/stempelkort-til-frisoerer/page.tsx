import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { FRISOERER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(FRISOERER);

export default function Page() {
  return <BranchePage b={FRISOERER} />;
}
