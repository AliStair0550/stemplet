import type { Metadata } from "next";
import { BranchePage } from "@/components/marketing/BranchePage";
import { KAFFEBARER, brancheMetadata } from "@/lib/brancher";

export const metadata: Metadata = brancheMetadata(KAFFEBARER);

export default function Page() {
  return <BranchePage b={KAFFEBARER} />;
}
