import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cardCookieName, DEVICE_ID_COOKIE } from "@/lib/cookies";
import { apiWriteRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Let svar paa eet spoergsmaal, mens kunden venter paa Wallet: er kortet landet?
// Claim-siden spoerger hvert par sekunder; den fulde status (henvisninger,
// beloenninger) hentes foerst, naar svaret er ja.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const no = () => NextResponse.json({ inWallet: false }, { headers: { "cache-control": "no-store" } });
  const { slug } = await params;
  if (!(await apiWriteRateLimit("shop-i-wallet", clientIp(req) ?? "ukendt", 1500, "1 h", 3600).catch(() => true))) {
    return no();
  }

  const shop = await prisma.business.findUnique({ where: { slug }, select: { id: true } }).catch(() => null);
  if (!shop) return no();

  const jar = await cookies();
  const token = jar.get(cardCookieName(shop.id))?.value;
  const deviceId = jar.get(DEVICE_ID_COOKIE)?.value;
  if (!token && !deviceId) return no();

  const n = await prisma.walletRegistration
    .count({
      where: {
        customerCard: {
          card: { businessId: shop.id },
          OR: [...(token ? [{ authToken: token }] : []), ...(deviceId ? [{ deviceId }] : [])],
        },
      },
    })
    .catch(() => 0);
  return NextResponse.json({ inWallet: n > 0 }, { headers: { "cache-control": "no-store" } });
}
