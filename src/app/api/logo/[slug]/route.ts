import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Serverer butikkens logo som en RIGTIG (cachet) billed-URL i stedet for at
// inline den store data-URI i HTML'en. Logoet ligger som data-URI i databasen,
// men naar det inlines paa fx kort-landingssiden, blev det duplikeret baade i
// markup og i RSC-payloaden (~5 kopier = ~100 KB ekstra HTML paa mobil). Ved at
// pege paa denne rute bliver HTML'en lille, og logoet hentes een gang og caches.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { logoUrl: true },
  });
  const url = business?.logoUrl;
  const m = url?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return new Response("Ikke fundet.", { status: 404 });
  const buf = Buffer.from(m[2], "base64");
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": m[1],
      // Logoer aendrer sig sjaeldent: cache haardt, men forny stille i baggrunden.
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
