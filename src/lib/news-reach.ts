import "server-only";
import { prisma } from "./prisma";

/** Antal kort i Apple Wallet hos butikken (kort med mindst een registrering),
 *  som ikke har slaaet pushbeskeder fra. Det er dem, der faar en pushbesked. */
export async function walletCardCount(businessId: string): Promise<number> {
  const rows = await prisma.walletRegistration.findMany({
    where: { customerCard: { card: { businessId }, newsOptOut: false } },
    select: { customerCardId: true },
    distinct: ["customerCardId"],
  });
  return rows.length;
}

/** Antal kortholdere, der har slaaet butikkens pushbeskeder fra. */
export async function newsOptOutCount(businessId: string): Promise<number> {
  return prisma.customerCard.count({ where: { card: { businessId }, newsOptOut: true } });
}
