import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Butikkens eget kortbillede (Design, "Dit billede") som en rigtig fil, saa den
// cachede butiksside ikke skal baere et stort indlejret billede. URL'en har en
// version (?v=), saa et nyt billede altid hentes, og et uaendret caches laenge.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await prisma.business.findUnique({ where: { slug }, select: { cardArtwork: true } });
  const m = b?.cardArtwork ? /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(b.cardArtwork) : null;
  if (!m) return new Response("Ikke fundet.", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(m[2]!, "base64")), {
    headers: {
      "content-type": m[1]!,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
