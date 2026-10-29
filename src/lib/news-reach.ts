import "server-only";
import { prisma } from "./prisma";

/** Antal kort i Apple Wallet hos butikken (kort med mindst een registrering).
 *  Det er dem, der faar en pushbesked. */
export async function walletCardCount(businessId: string): Promise<number> {
  const rows = await prisma.walletRegistration.findMany({
    where: { customerCard: { card: { businessId } } },
    select: { customerCardId: true },
    distinct: ["customerCardId"],
  });
  return rows.length;
}
